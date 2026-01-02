import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingCart, Wallet, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/wallet/WalletButton';

interface GuestCheckoutFormProps {
    onAccountCreated: (userId: string, walletAddress?: string) => void;
    totalAmount: number;
    currency: 'NGN' | 'USD';
}

export function GuestCheckoutForm({ onAccountCreated, totalAmount, currency }: GuestCheckoutFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();
    const wallet = useWallet();

    // For USD: wallet-first flow
    const isUSD = currency === 'USD';
    const walletConnected = wallet.connected && wallet.publicKey;
    const walletAddress = wallet.publicKey?.toBase58();

    const handleCreateAccountAndPay = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please enter email and password');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        // For USD, wallet must be connected first
        if (isUSD && !walletConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsCreating(true);

        try {
            console.log('Creating buyer account for guest checkout...');
            console.log('Wallet address to link:', walletAddress);

            // Create account with buyer role and wallet (if connected)
            const userData: Record<string, any> = {
                role: 'buyer',
                full_name: email.split('@')[0],
            };

            // Pre-link wallet for USD users
            if (isUSD && walletAddress) {
                userData.wallet_address = walletAddress;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData,
                }
            });

            if (error) {
                console.error('Signup error:', error);
                toast.error(error.message || 'Failed to create account');
                setIsCreating(false);
                return;
            }

            if (!data.user) {
                toast.error('Failed to create account');
                setIsCreating(false);
                return;
            }

            console.log('Account created successfully:', data.user.id);

            // INSERT user row into users table (Supabase trigger may not exist)
            const userRowData: Record<string, any> = {
                id: data.user.id,
                email: email,
                full_name: email.split('@')[0],
                role: 'buyer',
                status: 'active',
            };

            // Add wallet address for USD users
            if (isUSD && walletAddress) {
                userRowData.wallet_address = walletAddress;
            }

            const { error: insertError } = await supabase
                .from('users')
                .insert([userRowData] as any);

            if (insertError) {
                // Could be duplicate key if trigger exists, that's OK
                if (!insertError.message.includes('duplicate key')) {
                    console.error('Failed to insert user row:', insertError);
                } else {
                    console.log('User row already exists (trigger created it)');

                    // If trigger created the row, UPDATE with wallet address
                    if (isUSD && walletAddress) {
                        await supabase
                            .from('users')
                            .update({ wallet_address: walletAddress })
                            .eq('id', data.user.id);
                    }
                }
            } else {
                console.log('User row created successfully with wallet:', walletAddress);
            }

            // Migrate guest cart to user cart
            const guestCart = localStorage.getItem('cart_guest');
            if (guestCart) {
                localStorage.setItem(`cart_${data.user.id}`, guestCart);
                localStorage.removeItem('cart_guest');
                console.log('Guest cart migrated to user cart');
            }

            toast.success('Account created! Proceeding to payment...');

            // Notify parent component
            onAccountCreated(data.user.id, walletAddress);

        } catch (error: any) {
            console.error('Account creation error:', error);
            toast.error(error.message || 'Failed to create account');
            setIsCreating(false);
        }
    };

    // NGN Flow: Simple email/password form
    if (!isUSD) {
        return (
            <Card className="border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Quick Checkout
                    </CardTitle>
                    <CardDescription>
                        Create an account to complete your purchase
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateAccountAndPay} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isCreating}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isCreating}
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account & Pay ₦{Math.round(totalAmount).toLocaleString()}
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-primary hover:underline"
                            >
                                Log in
                            </button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        );
    }

    // USD Flow: Wallet-first, then email/password
    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Pay with USDC
                </CardTitle>
                <CardDescription>
                    Connect wallet, then create account to pay
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Step 1: Connect Wallet */}
                <div className={`p-3 rounded-lg border ${walletConnected ? 'border-green-500/50 bg-green-500/10' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                            {walletConnected ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">1</span>
                            )}
                            Connect Wallet
                        </span>
                    </div>
                    {walletConnected ? (
                        <p className="text-xs text-green-600 dark:text-green-400">
                            ✓ {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
                        </p>
                    ) : (
                        <WalletButton buttonClass="w-full" />
                    )}
                </div>

                {/* Step 2: Create Account (only shown after wallet connected) */}
                {walletConnected && (
                    <form onSubmit={handleCreateAccountAndPay} className="space-y-4">
                        <div className={`p-3 rounded-lg border border-border`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">2</span>
                                <span className="text-sm font-medium">Create Account to Pay</span>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="email-usd" className="text-xs">Email</Label>
                                    <Input
                                        id="email-usd"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isCreating}
                                        required
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="password-usd" className="text-xs">Password</Label>
                                    <Input
                                        id="password-usd"
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isCreating}
                                        required
                                        minLength={6}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            variant="premium"
                            disabled={isCreating || !email || !password}
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account & Pay ${Math.round(totalAmount).toLocaleString()}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-primary hover:underline"
                    >
                        Log in
                    </button>
                </p>
            </CardContent>
        </Card>
    );
}

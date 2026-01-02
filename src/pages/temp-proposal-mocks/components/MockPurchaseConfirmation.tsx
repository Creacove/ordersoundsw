import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Lock, Disc, AlertCircle } from "lucide-react";

const MockPurchaseConfirmation = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-16 py-14">

            {/* Visual Success Header - BIGGER */}
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-6xl font-black tracking-tighter text-white">Purchase Successful</h1>
                    <p className="text-2xl text-muted-foreground font-medium">Order #8821 confirmed.</p>
                </div>
            </div>

            {/* The "Frozen Rights" Visualization - UPSCALED */}
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />

                <Card className="bg-[#121212] border-white/10 overflow-hidden relative z-10 rounded-[3rem]">
                    <div className="flex flex-col md:flex-row h-[400px]">

                        {/* Left: Active Now */}
                        <div className="flex-1 p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.01]">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Disc className="w-8 h-8 text-white" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black uppercase tracking-[0.2em] text-white">Beat Access</h3>
                                <p className="text-sm text-green-500 font-bold mt-1 flex items-center justify-center gap-2 bg-green-500/10 px-4 py-1 rounded-full w-fit mx-auto">
                                    <CheckCircle2 className="w-4 h-4" /> UNLOCKED
                                </p>
                            </div>
                            <p className="text-base text-white/60 max-w-[200px] leading-relaxed">
                                Files delivered. You can start recording immediately.
                            </p>
                        </div>

                        {/* Right: Frozen State (The Core Message) */}
                        <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden bg-blue-900/[0.05]">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]" />
                            </div>

                            <div className="w-24 h-24 rounded-3xl bg-[#0a0a0a] border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.15)] relative z-10 transform scale-110">
                                <Lock className="w-10 h-10 text-blue-400" />
                            </div>

                            <div className="relative z-10 space-y-2">
                                <h3 className="text-lg font-black uppercase tracking-[0.2em] text-blue-400">Publishing Rights</h3>
                                <p className="text-sm text-white/80 font-bold bg-black/40 px-4 py-1.5 rounded-full border border-white/10 inline-block">
                                    PENDING FINALIZATION
                                </p>
                            </div>

                            <p className="text-base text-white/60 max-w-[240px] relative z-10 leading-relaxed font-medium">
                                Rights are currently <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">frozen</span>. Finish song to activate Nexus Admin.
                            </p>
                        </div>

                    </div>

                    {/* Footer Action */}
                    <div className="bg-white/[0.02] border-t border-white/5 p-6 flex items-center justify-center gap-3 text-sm text-white/50 w-full font-medium">
                        <AlertCircle className="w-5 h-5" />
                        Complete your song to activate Nexus Governance.
                    </div>
                </Card>
            </div>

            <div className="flex justify-center">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/10 hover:bg-white/5 text-white rounded-2xl">
                    Go to Library
                </Button>
            </div>

        </div>
    );
};

export default MockPurchaseConfirmation;

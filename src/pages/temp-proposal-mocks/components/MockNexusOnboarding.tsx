import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, Music, Image as ImageIcon, Plus, Info, CheckCircle2 } from "lucide-react";

const MockNexusOnboarding = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-8 py-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-white">New Release Registration</h1>
                    <p className="text-lg text-muted-foreground">Submit metadata for Nexus Publishing Administration.</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Service Provider</p>
                    <div className="bg-white rounded-xl p-3 border border-white/10 shadow-lg">
                        <img src="/nexus-logo.png" alt="Nexus" className="h-6 object-contain" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left: Assets */}
                <div className="md:col-span-4 space-y-6">
                    <div className="aspect-square bg-[#121212] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:bg-white/[0.05] cursor-pointer transition-colors group">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-50 group-hover:scale-110 transition-transform text-white" />
                        <p className="text-sm font-bold uppercase tracking-widest text-white">Cover Art</p>
                        <p className="text-[10px] opacity-50 font-bold">3000 x 3000px</p>
                    </div>

                    <Card className="bg-[#121212] border-white/10 rounded-2xl">
                        <CardHeader className="pb-3 pt-5 px-5">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Audio Master</CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center p-4 hover:bg-white/[0.05] cursor-pointer transition-colors">
                                <Upload className="w-6 h-6 text-primary mb-2" />
                                <p className="text-sm font-bold text-white">Upload WAV</p>
                                <p className="text-[10px] text-white/50 mt-0.5 font-bold">24-bit / 48kHz</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Metadata Form */}
                <div className="md:col-span-8">
                    <Card className="bg-[#121212] border-white/10 rounded-3xl h-full shadow-2xl">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <Music className="w-4 h-4" />
                                </div>
                                <span className="text-xl font-bold text-white">Essential Metadata</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {/* Track Info */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-sm font-bold text-white/70">Track Title</Label>
                                    <Input placeholder="e.g. Summer Nights" className="bg-white/5 border-white/10 h-12 text-lg text-white font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-white/70">Primary Artist</Label>
                                    <Input placeholder="Artist Name" className="bg-white/5 border-white/10 h-12 text-lg text-white font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-white/70">Featured Artist</Label>
                                    <Input placeholder="Feat." className="bg-white/5 border-white/10 h-12 text-lg text-white font-medium" />
                                </div>
                                {/* Compact Row: ISRC + Explicit */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-white/70">ISRC Code</Label>
                                    <Input placeholder="US-XXX-24-00001" className="bg-white/5 border-white/10 h-12 text-lg text-white font-mono" />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="flex items-center justify-between px-4 rounded-xl bg-white/[0.04] border border-white/10 h-12">
                                        <Label className="cursor-pointer text-sm font-bold text-white/90">Explicit Content</Label>
                                        <div className="w-10 h-6 bg-white/10 rounded-full relative cursor-pointer">
                                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            {/* Splits Section - Compact */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Publishing Splits</Label>
                                    <div className="px-2 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary text-[10px] font-black tracking-wide">TOTAL: 100%</div>
                                </div>

                                {/* Writer 1 */}
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <Input value="You (Primary Writer)" className="bg-white/5 border-white/10 h-12 text-base text-white font-medium" readOnly />
                                    </div>
                                    <div className="w-24">
                                        <Input value="50%" className="bg-white/5 border-white/10 font-black text-lg text-center h-12 text-white" />
                                    </div>
                                </div>

                                {/* Writer 2 */}
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <Input placeholder="Add Co-Writer" className="bg-transparent border-white/10 border-dashed h-12 text-base" />
                                    </div>
                                    <div className="w-24">
                                        <Input placeholder="50%" className="bg-transparent border-white/10 border-dashed text-center h-12 text-lg font-bold" />
                                    </div>
                                    <Button size="icon" variant="ghost" className="w-10 h-10 rounded-full hover:bg-white/10">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-xl p-4 flex gap-3 border border-white/5 mt-2">
                                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white uppercase tracking-wide">Nexus Admin Authorization</p>
                                    <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                        By submitting, you confirm you control the rights to the uploaded master and authorize Nexus to register the musical composition with global collection societies.
                                    </p>
                                </div>
                            </div>

                            <Button className="w-full h-14 text-lg font-black bg-white text-black hover:bg-white/90 shadow-2xl rounded-xl uppercase tracking-wide">
                                SUBMIT RELEASE
                            </Button>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MockNexusOnboarding;

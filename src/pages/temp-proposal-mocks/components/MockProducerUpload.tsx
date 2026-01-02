import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Upload, Image as ImageIcon, Lock, Info, Percent } from "lucide-react";

const MockProducerUpload = () => {
    const [split, setSplit] = useState([50]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto py-8">
            <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black tracking-tighter text-white">Upload New Beat</h2>
                <Button variant="ghost" className="text-white/60 hover:text-white text-xl">Cancel</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Media (Audio + Image) */}
                <div className="md:col-span-4 space-y-6">
                    {/* Cover Art */}
                    <Card className="bg-[#121212] border-white/10 aspect-square flex flex-col items-center justify-center text-white/60 hover:bg-white/[0.05] cursor-pointer transition-colors border-dashed border-2 rounded-3xl group">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-70 group-hover:scale-110 transition-transform text-white" />
                        <p className="text-base font-bold uppercase tracking-widest text-white">Upload Artwork</p>
                    </Card>

                    {/* Audio File */}
                    <Card className="bg-[#121212] border-white/10 p-8 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-3 hover:bg-white/[0.05] cursor-pointer transition-colors rounded-3xl">
                        <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center">
                            <Upload className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">Upload Audio</p>
                            <p className="text-sm text-white/50 font-bold">WAV / MP3</p>
                        </div>
                    </Card>
                </div>

                {/* Middle Column: Metadata */}
                <div className="md:col-span-4 space-y-4">
                    <Card className="bg-[#121212] border-white/10 h-full rounded-3xl shadow-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-white">Track Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-base font-bold text-white/70">Title</Label>
                                <Input placeholder="Enter beat title..." className="bg-white/5 border-white/10 h-14 text-xl text-white placeholder:text-white/30" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-white/70">BPM</Label>
                                    <Input placeholder="140" className="bg-white/5 border-white/10 h-14 text-xl text-white" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-base font-bold text-white/70">Key</Label>
                                    <Input placeholder="Cm" className="bg-white/5 border-white/10 h-14 text-xl text-white" />
                                </div>
                            </div>
                            <div className="space-y-3 pt-4">
                                <Label className="text-base font-bold text-white/70">Price ($)</Label>
                                <Input placeholder="29.99" className="bg-white/5 border-white/10 font-black text-3xl h-16 text-white" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Nexus Governance (Expanded Width for Text Safety) */}
                <div className="md:col-span-4 space-y-4">
                    <Card className="bg-transparent border-none shadow-none h-full">
                        <CardContent className="p-0 space-y-6 h-full flex flex-col">
                            <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 space-y-6 flex-1">
                                <div className="flex items-center gap-3 text-white/60">
                                    <Lock className="w-5 h-5" />
                                    <span className="text-sm uppercase font-black tracking-widest">Publishing Splits</span>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                        <Label className="text-base text-white/80 font-bold">Producer Share</Label>
                                        <span className="text-4xl font-black text-white">{split}%</span>
                                    </div>
                                    <Slider
                                        defaultValue={[50]}
                                        max={50}
                                        step={1}
                                        onValueChange={(val) => setSplit(val)}
                                        className="py-2"
                                    />
                                    <p className="text-sm font-medium text-white/50 leading-relaxed">
                                        Capped at 50% to ensure correct split allocation.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-6 rounded-3xl border border-primary/20 bg-primary/10 flex gap-4 items-start">
                                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                                <p className="text-sm text-white/90 leading-relaxed font-medium">
                                    <span className="text-white font-bold block mb-1">Nexus Governance</span>
                                    Administers the remaining share to secure global royalties upon purchase.
                                </p>
                            </div>

                            <Button className="w-full h-16 text-lg font-black shadow-xl rounded-2xl bg-white text-black hover:bg-white/90 uppercase tracking-wide">
                                PUBLISH BEAT
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MockProducerUpload;

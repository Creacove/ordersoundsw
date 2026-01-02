import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Database, FileAudio, Percent, User, ShieldCheck, Mail, FileText, Hash, Globe, Music, Image as ImageIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const MockWorkflowDiagram = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-16 py-12">
            <div className="text-center space-y-4">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white">Structural Handoff</h2>
                <p className="text-muted-foreground text-2xl font-light">The invisible architecture connecting creation to governance.</p>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 p-16 rounded-[60px] bg-[#121212] border border-white/5 overflow-hidden">
                {/* Background Decorative Mesh */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                {/* Source: Ordersounds */}
                <div className="z-10 w-full md:w-1/3 flex flex-col items-center gap-8">
                    <div className="group relative">
                        <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-10 rounded-[2rem] bg-black border-2 border-white/10 flex items-center justify-center shadow-2xl relative">
                            {/* BRANDED LOGO - Using existing component */}
                            <Logo className="scale-[2.0]" />
                        </div>
                    </div>
                    <div className="text-center space-y-3">
                        <h3 className="text-3xl font-bold text-white">Ordersounds</h3>
                        <Badge variant="outline" className="border-primary/50 text-primary text-xs px-3 py-1 bg-primary/5 font-black tracking-widest">TRANSACTION LAYER</Badge>
                    </div>

                    <Card className="w-full bg-black/40 border-white/10 backdrop-blur-sm rounded-3xl">
                        <CardContent className="p-8 space-y-5">
                            <div className="flex items-center gap-4 text-sm text-white/60 border-b border-white/5 pb-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> Payment Confirmed
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/60 border-b border-white/5 pb-3">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> Files Delivered
                            </div>
                            <div className="flex items-center gap-4 text-base text-white font-black italic">
                                <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.8)]" /> Song Finalized
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transition: THE PUBLISHING MANIFEST */}
                <div className="flex-1 flex flex-col items-center gap-8 relative w-full">
                    <div className="w-full flex items-center px-8">
                        <div className="h-[4px] flex-1 bg-gradient-to-r from-white/0 via-white/20 to-white/0 relative rounded-full">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] z-20 border-4 border-[#121212]">
                                <ArrowRight className="w-6 h-6 stroke-[3px]" />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 transform scale-125 origin-center my-6">
                        <Card className="bg-[#e4e4e7] border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.05)] overflow-hidden w-80 rounded-2xl text-black">
                            <div className="bg-white p-4 text-center border-b border-black/5">
                                <span className="text-sm font-black uppercase tracking-[0.2em] text-black/70">Publishing Manifest</span>
                            </div>
                            <CardContent className="p-6 space-y-3 text-xs font-medium">
                                {/* The New Work */}
                                <div className="space-y-1 border-b border-black/5 pb-2">
                                    <span className="text-[10px] uppercase font-black text-black/40 tracking-wider flex items-center gap-1"><Music size={10} /> The New Work</span>
                                    <div className="flex justify-between items-center text-black/80 font-bold">
                                        <span>Title</span>
                                        <span className="text-right">"Summer Nights"</span>
                                    </div>
                                    <div className="flex justify-between items-center text-black/80 font-bold">
                                        <span>Artist</span>
                                        <span className="text-right">Kid Waves</span>
                                    </div>
                                </div>

                                {/* Chain of Title */}
                                <div className="space-y-1 border-b border-black/5 pb-2">
                                    <span className="text-[10px] uppercase font-black text-black/40 tracking-wider flex items-center gap-1"><FileText size={10} /> Rights & Splits</span>
                                    <div className="flex justify-between items-center text-black/80">
                                        <span>Producer (50%)</span>
                                        <span className="font-mono">@beats_by_alex</span>
                                    </div>
                                    <div className="flex justify-between items-center text-black/80">
                                        <span>License Ref</span>
                                        <span className="font-mono">#LIC-992-EX</span>
                                    </div>
                                </div>

                                {/* Assets */}
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-black text-black/40 tracking-wider flex items-center gap-1"><FileAudio size={10} /> Deliverables</span>
                                    <div className="flex justify-between items-center text-black/80">
                                        <span>Master Audio</span>
                                        <span>WAV (24/48)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-black/80">
                                        <span>Cover Art</span>
                                        <span>JPG (3000px)</span>
                                    </div>
                                </div>

                                {/* More Indicator */}
                                <div className="pt-2 text-center">
                                    <span className="text-[10px] text-black/40 font-bold italic tracking-widest">+ Validated Metadata</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <p className="text-xs uppercase font-black tracking-[0.2em] text-white/40 bg-white/5 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Automated Data Delivery
                    </p>
                </div>

                {/* Target: Nexus */}
                <div className="z-10 w-full md:w-1/3 flex flex-col items-center gap-8">
                    <div className="group relative">
                        <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-10 rounded-[2rem] bg-white flex items-center justify-center shadow-2xl relative border-2 border-white/10">
                            <img src="/nexus-logo.png" alt="Nexus" className="w-56 object-contain" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <Badge variant="outline" className="border-blue-500/50 text-blue-500 text-xs px-3 py-1 bg-blue-500/5 font-black tracking-widest">GOVERNANCE LAYER</Badge>
                    </div>

                    <Card className="w-full bg-black/40 border-white/10 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-3xl">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wide">Rights Ingestion</h4>
                                    <p className="text-xs text-white/50 mt-1 leading-relaxed">Data packet received and validated.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20 text-blue-500">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wide">Registration</h4>
                                    <p className="text-xs text-white/50 mt-1 leading-relaxed">Song registered at PROs (ASCAP/BMI) + MLC.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MockWorkflowDiagram;

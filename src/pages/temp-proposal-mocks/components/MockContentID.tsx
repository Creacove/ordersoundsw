import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Youtube, Music2, Globe, AlertTriangle, CheckCircle2, MoreVertical, ShieldAlert, Activity } from "lucide-react";

const MockContentID = () => {
    const [searchTerm, setSearchTerm] = useState("Midnight Rain (Master Mix)");

    const matches = [
        { source: "YouTube", type: "User Generated Content", confidence: "99%", status: "UNLICENSED", id: "yt_0982", icon: <Youtube className="w-5 h-5 text-white" /> },
        { source: "Spotify", type: "Digital Store", confidence: "100%", status: "LICENSED", id: "sp_3321", icon: <Music2 className="w-5 h-5 text-white" /> },
        { source: "TikTok", type: "Social Video", confidence: "94%", status: "UNLICENSED", id: "tk_4411", icon: <Globe className="w-5 h-5 text-white" /> },
        { source: "SoundCloud", type: "Audio Stream", confidence: "91%", status: "UNLICENSED", id: "sc_1122", icon: <Music2 className="w-5 h-5 text-white" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Fingerprinting Active</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white">Audio Rights Protection</h2>
                    <p className="text-lg text-white/60">Scanning the global ecosystem for matches.</p>
                </div>

                {/* Stats Card - High Contrast */}
                <Card className="bg-[#121212] border-white/10 p-6 min-w-[320px] rounded-2xl shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="flex-1 space-y-2">
                            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Catalog Match Rate</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-white">82%</span>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+12%</span>
                            </div>
                        </div>
                        <div className="h-12 w-px bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Active Flags</p>
                            <span className="text-4xl font-black text-white">24</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search Bar - Big & Clean */}
            <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-white/50" />
                </div>
                <Input
                    className="h-20 pl-14 bg-[#121212] border-white/10 text-2xl font-medium rounded-2xl text-white shadow-2xl focus:border-white/20 transition-all placeholder:text-white/20"
                    value={searchTerm}
                    readOnly
                />
                <div className="absolute inset-y-3 right-3">
                    <Button className="h-full px-8 rounded-xl font-bold bg-white text-black hover:bg-white/90 text-sm tracking-wide shadow-lg">
                        RE-SCAN ASSET
                    </Button>
                </div>
            </div>

            {/* Results Table - Clean & Legible */}
            <Card className="bg-[#121212] border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardHeader className="bg-white/[0.03] border-b border-white/5 px-10 py-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm uppercase font-black tracking-[0.2em] text-white/40">Global Match Results</CardTitle>
                    <span className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full">4 FOUND</span>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-transparent">
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="px-10 py-6 text-xs font-black uppercase text-white/30 tracking-widest">Source</TableHead>
                                <TableHead className="text-xs font-black uppercase text-white/30 tracking-widest">Confidence</TableHead>
                                <TableHead className="text-xs font-black uppercase text-white/30 tracking-widest">Status</TableHead>
                                <TableHead className="text-right px-10 text-xs font-black uppercase text-white/30 tracking-widest">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matches.map((match, i) => (
                                <TableRow key={i} className="border-white/5 hover:bg-white/[0.04] transition-colors h-24">
                                    <TableCell className="px-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                                {match.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-white tracking-tight">{match.source}</p>
                                                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{match.type}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-white" style={{ width: match.confidence }} />
                                            </div>
                                            <span className="text-sm font-bold text-white">{match.confidence}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {match.status === "LICENSED" ? (
                                            <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg w-fit border border-green-500/20">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-wider">Verified</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg w-fit border border-red-500/20">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span className="text-xs font-black uppercase tracking-wider">Unlicensed</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right px-10">
                                        {match.status === "LICENSED" ? (
                                            <span className="text-xs font-bold text-white/20 uppercase tracking-widest">No Action Reqd</span>
                                        ) : (
                                            <div className="flex items-center justify-end gap-3">
                                                <Button className="bg-white text-black hover:bg-white/90 font-bold text-xs uppercase tracking-wider h-9 px-4 shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-lg border-2 border-transparent">
                                                    Issue Takedown
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Footer Info */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex items-start gap-4 mx-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-base text-white">Nexus Copyright Enforcement</h4>
                    <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-2xl">
                        Takedown requests act immediately. Nexus acts as your authorized agent with major DSPs to resolve usage disputes within 24-48 hours.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MockContentID;

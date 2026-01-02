import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, MoreHorizontal, ArrowRight, ShieldAlert, Download } from "lucide-react";

const MockBuyerDashboard = () => {
    const purchases = [
        { title: "Midnight Rain", producer: "Antigravity", date: "Dec 28, 2025", status: "PENDING_DATA" },
        { title: "Neon Tokyo", producer: "DriftKing", date: "Dec 15, 2025", status: "COMPLETED" },
        { title: "Soul Searching", producer: "Lofi Girl", date: "Nov 02, 2025", status: "PENDING_DATA" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 py-10">
            <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black tracking-tighter text-white">My Library</h2>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">Filter View</Button>
            </div>

            <Card className="bg-[#121212] border-white/10 overflow-hidden rounded-3xl shadow-2xl">
                <Table>
                    <TableHeader className="bg-white/[0.03]">
                        <TableRow className="border-white/5 hover:bg-transparent h-14">
                            <TableHead className="w-[60px]"></TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-white/50">Track</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-white/50">Purchase Date</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-white/50">Nexus Status</TableHead>
                            <TableHead className="text-right text-xs font-black uppercase tracking-widest text-white/50 pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchases.map((track, i) => (
                            <TableRow key={i} className="border-white/5 hover:bg-white/[0.04] h-24 group transition-colors">
                                {/* Play Button */}
                                <TableCell>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors cursor-pointer text-white">
                                        <Play className="w-5 h-5 ml-0.5" />
                                    </div>
                                </TableCell>

                                {/* Track Info - Larger Text */}
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/5" />
                                        <div>
                                            <p className="font-bold text-lg text-white tracking-tight">{track.title}</p>
                                            <p className="text-sm text-white/60 font-medium">{track.producer}</p>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Date */}
                                <TableCell className="text-sm text-white/50 font-mono font-bold">
                                    {track.date}
                                </TableCell>

                                {/* STATUS - High Contrast */}
                                <TableCell>
                                    {track.status === "PENDING_DATA" ? (
                                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 w-fit">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-xs font-black uppercase tracking-wide text-yellow-500">Needs Finalization</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 w-fit">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-xs font-black uppercase tracking-wide text-green-500">Publishing Active</span>
                                        </div>
                                    )}
                                </TableCell>

                                {/* Actions - HIGH CONTRAST BUTTON */}
                                <TableCell className="text-right pr-8">
                                    <div className="flex items-center justify-end gap-3">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 hover:text-white rounded-full">
                                            <Download className="w-5 h-5" />
                                        </Button>

                                        {/* THE CTA BUTTON - WHITE AND BIG */}
                                        {track.status === "PENDING_DATA" && (
                                            <Button className="h-10 px-6 bg-white text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white/90 hover:scale-105 transition-all rounded-full">
                                                Finish Publishing
                                            </Button>
                                        )}

                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-white/40 hover:text-white rounded-full">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Helper Context - High Visibility */}
            <div className="flex justify-end pr-4">
                <p className="text-sm font-medium text-white/50 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-white/30" />
                    Finish publishing to activate royalty collection.
                </p>
            </div>
        </div>
    );
};

export default MockBuyerDashboard;

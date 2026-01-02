import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import MockProducerUpload from "./components/MockProducerUpload";
import MockPurchaseConfirmation from "./components/MockPurchaseConfirmation";
import MockBuyerDashboard from "./components/MockBuyerDashboard";
import MockWorkflowDiagram from "./components/MockWorkflowDiagram";
import MockContentID from "./components/MockContentID";
import MockNexusOnboarding from "./components/MockNexusOnboarding";

const ProposalMocksLayout = () => {
    const [activeScreen, setActiveScreen] = useState(0);

    const screens = [
        { name: "1. Beat Upload", component: <MockProducerUpload /> },
        { name: "2. Purchase Confirmation", component: <MockPurchaseConfirmation /> },
        { name: "3. Buyer Dashboard", component: <MockBuyerDashboard /> },
        { name: "4. Workflow Diagram", component: <MockWorkflowDiagram /> },
        { name: "5. Content ID Search", component: <MockContentID /> },
        { name: "6. Nexus Registration", component: <MockNexusOnboarding /> },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
            {/* Navigation Header */}
            <div className="sticky top-0 z-50 bg-[#121212]/80 backdrop-blur-md border-b border-white/10 p-4 shadow-xl">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-black italic">OS</div>
                        <h1 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mr-4">Nexus Partnership Pilot</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {screens.map((screen, index) => (
                            <Button
                                key={index}
                                variant={activeScreen === index ? "default" : "secondary"}
                                size="sm"
                                onClick={() => setActiveScreen(index)}
                                className={`h-9 text-xs transition-all duration-300 ${activeScreen === index ? 'shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-105' : 'hover:bg-white/10'}`}
                            >
                                {screen.name}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center p-6 md:p-12 transition-all duration-500">
                <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    {screens[activeScreen].component}
                </div>
            </main>

            {/* Instructional Footer */}
            <footer className="p-4 bg-[#0a0a0a] border-t border-white/5 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Sandbox Environment • Not Connected to Production Database • For Screenshot Purposes Only
            </footer>
        </div>
    );
};

export default ProposalMocksLayout;


import React from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { ImageUpload } from "@/components/sandbox/ImageUploadSandbox";

const Sandbox = () => {
  return (
    <MainLayoutWithPlayer activeTab="sandbox" currentPath="/sandbox">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sandbox</h1>
          <p className="text-muted-foreground">
            Test image upload functionality to Supabase storage
          </p>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Image Upload Test</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Upload images to the 'covers' bucket in Supabase storage
          </p>
          <ImageUpload />
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Sandbox;

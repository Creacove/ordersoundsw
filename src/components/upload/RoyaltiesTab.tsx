
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Plus, X } from "lucide-react";
import { Collaborator } from "@/hooks/useBeatUpload";

type RoyaltiesTabProps = {
  collaborators: Collaborator[];
  handleRemoveCollaborator: (id: number) => void;
  handleCollaboratorChange: (id: number, field: string, value: string | number) => void;
  handleAddCollaborator: () => void;
  beatStatus?: "draft" | "published";
  onUpdate?: () => void;
  onPublish?: () => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
};

export const RoyaltiesTab = ({
  collaborators,
  handleRemoveCollaborator,
  handleCollaboratorChange,
  handleAddCollaborator,
  // Remove button-business props
}: RoyaltiesTabProps) => {
  const totalPercentage = collaborators.reduce((sum, c) => sum + c.percentage, 0);

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 -purple- flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium">Royalty Splits</h3>
          <p className="text-sm text-muted-foreground">
            Define how royalties should be distributed among collaborators. 
            The total percentage must equal 100%.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {collaborators.map((collaborator, index) => (
          <div key={collaborator.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-base">
                {index === 0 ? "You (Main Producer)" : `Collaborator ${index + 1}`}
              </h3>
              {collaborators.length > 1 && index !== 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveCollaborator(collaborator.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`name-${collaborator.id}`} size="lg">Name</Label>
                <Input 
                  id={`name-${collaborator.id}`}
                  value={collaborator.name}
                  onChange={(e) => handleCollaboratorChange(collaborator.id, 'name', e.target.value)}
                  placeholder="Collaborator's name"
                  disabled={index === 0}
                  className={index === 0 ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <Label htmlFor={`email-${collaborator.id}`} size="lg">Email</Label>
                <Input 
                  id={`email-${collaborator.id}`}
                  value={collaborator.email}
                  onChange={(e) => handleCollaboratorChange(collaborator.id, 'email', e.target.value)}
                  placeholder="Collaborator's email"
                  disabled={index === 0}
                  className={index === 0 ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <Label htmlFor={`role-${collaborator.id}`} size="lg">Role</Label>
                <Input 
                  id={`role-${collaborator.id}`}
                  value={collaborator.role}
                  onChange={(e) => handleCollaboratorChange(collaborator.id, 'role', e.target.value)}
                  placeholder="e.g. Producer, Engineer"
                  disabled={index === 0}
                  className={index === 0 ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <Label htmlFor={`percentage-${collaborator.id}`} size="lg">Percentage (%)</Label>
                <Input 
                  id={`percentage-${collaborator.id}`}
                  type="number"
                  min="1"
                  max="100"
                  value={collaborator.percentage}
                  onChange={(e) => handleCollaboratorChange(collaborator.id, 'percentage', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        ))}
        {collaborators.length < 5 && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleAddCollaborator}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Collaborator
          </Button>
        )}
        <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Total Percentage:</span>
          <span 
            className={`font-bold text-base ${
              totalPercentage === 100 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}
          >
            {totalPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

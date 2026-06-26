import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Trash2, PenIcon, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileImageUploadProps {
  userId: number;
  patientId?: number;
  doctorId?: number;
  profilePicture: string | null;
  firstName?: string;
  lastName?: string;
  onImageUpdated: (imageUrl: string | null) => void;
}

export default function ProfileImageUpload({
  userId,
  patientId,
  doctorId,
  profilePicture,
  firstName = "",
  lastName = "",
  onImageUpdated,
}: ProfileImageUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Determine whether we're dealing with a patient or doctor profile
  const isPatientProfile = !!patientId;
  const profileType = isPatientProfile ? "patient" : "doctor";
  const profileId = isPatientProfile ? patientId : doctorId;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await fetch(`/api/${profileType}/${profileId}/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload image: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
      onImageUpdated(data.profilePicture);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Profile image upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/${profileType}/${profileId}/image`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete image: ${errorText}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed successfully.",
      });
      onImageUpdated(null);
    },
    onError: (error: Error) => {
      console.error("Profile image deletion error:", error);
      toast({
        title: "Deletion failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Get initials for avatar fallback
  const initials = `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}`;

  console.log("ProfileImageUpload - Profile picture path:", profilePicture);

  return (
    <div className="relative group">
      <Avatar className="h-20 w-20 cursor-pointer group">
        {profilePicture ? (
          <AvatarImage 
            src={profilePicture} 
            alt={`${firstName} ${lastName}`}
            onError={(e) => {
              console.error("Image failed to load:", profilePicture);
              // Try with absolute URL if it's a relative path
              const target = e.target as HTMLImageElement;
              if (profilePicture.startsWith('/')) {
                const baseUrl = window.location.origin;
                target.src = `${baseUrl}${profilePicture}`;
                console.log("Retrying with absolute URL:", target.src);
              }
            }}
          />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary text-xl">
          {initials.length > 0 ? initials : <User className="h-8 w-8" />}
        </AvatarFallback>
      </Avatar>
      
      {/* Hover overlay with actions */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
        <div className="flex space-x-1">
          {/* Upload button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/90 hover:bg-white">
                <PenIcon className="h-4 w-4 text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Profile Picture</DialogTitle>
                <DialogDescription>
                  Choose a new profile picture to upload. 
                  Square images work best.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center space-y-4 py-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="profileImage"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="profileImage" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Click to select image</span>
                    <span className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF up to 2MB</span>
                  </label>
                </div>
                
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={previewUrl} />
                      </Avatar>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="ml-2"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload Picture"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete button - only show if there's an existing profile picture */}
          {profilePicture && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/90 hover:bg-white">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Profile Picture</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove your profile picture? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={(e) => {
                      e.preventDefault();
                      deleteMutation.mutate();
                    }}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Removing..." : "Remove Picture"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
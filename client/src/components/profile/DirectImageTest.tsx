import { useState, useEffect } from 'react';

interface DirectImageTestProps {
  imagePath: string | null;
}

export default function DirectImageTest({ imagePath }: DirectImageTestProps) {
  const [absoluteUrl, setAbsoluteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imagePath && imagePath.startsWith('/')) {
      const baseUrl = window.location.origin;
      setAbsoluteUrl(`${baseUrl}${imagePath}`);
    } else {
      setAbsoluteUrl(imagePath);
    }
  }, [imagePath]);

  if (!imagePath) return <div>No image path provided</div>;

  return (
    <div className="border p-4 mt-4 bg-slate-50 rounded-md">
      <h3 className="text-lg font-medium mb-2">Image Test</h3>
      <div className="space-y-2">
        <p className="text-sm"><strong>Image path:</strong> {imagePath}</p>
        {absoluteUrl && (
          <p className="text-sm"><strong>Absolute URL:</strong> {absoluteUrl}</p>
        )}
        <div className="mt-4 bg-white p-2 border rounded">
          <h4 className="text-sm font-medium mb-2">Direct IMG tag:</h4>
          <img 
            src={imagePath} 
            alt="Test with relative path" 
            className="h-20 w-20 object-cover rounded-full"
            onError={(e) => {
              console.error("Failed to load image with relative path");
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        {absoluteUrl && (
          <div className="mt-4 bg-white p-2 border rounded">
            <h4 className="text-sm font-medium mb-2">IMG with absolute URL:</h4>
            <img 
              src={absoluteUrl} 
              alt="Test with absolute URL" 
              className="h-20 w-20 object-cover rounded-full"
              onError={(e) => {
                console.error("Failed to load image with absolute URL");
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
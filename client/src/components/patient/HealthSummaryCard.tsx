import { Link } from "wouter";
import { Shield, Zap, FlaskRound, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthRecord {
  id: number;
  patientId: number;
  recordType: string;
  name: string;
  details?: string;
  date: string;
  isActive: boolean;
}

interface Patient {
  id: number;
  userId: number;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  [key: string]: any;
}

interface HealthSummaryCardProps {
  healthRecords: HealthRecord[];
  patient: Patient | null;
}

export default function HealthSummaryCard({ healthRecords, patient }: HealthSummaryCardProps) {
  // Filter health records by type
  const getAllergies = () => {
    return healthRecords
      .filter(record => record.recordType === 'allergy' && record.isActive)
      .map(record => record.name)
      .join(', ');
  };

  const getMedications = () => {
    return healthRecords
      .filter(record => record.recordType === 'medication' && record.isActive)
      .map(record => record.name)
      .join(', ');
  };

  // Get last checkup date from health records
  const getLastCheckup = () => {
    const checkups = healthRecords
      .filter(record => record.recordType === 'checkup')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (checkups.length > 0) {
      return new Date(checkups[0].date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return 'Not available';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-neutral-800 mb-4">Health Summary</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="ml-2 text-sm font-medium text-neutral-700">Last Checkup</span>
          </div>
          <span className="text-sm text-neutral-600">{getLastCheckup()}</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-green-500" />
            <span className="ml-2 text-sm font-medium text-neutral-700">Allergies</span>
          </div>
          <span className="text-sm text-neutral-600">{getAllergies() || 'None recorded'}</span>
        </div>
        
        <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
          <div className="flex items-center">
            <FlaskRound className="h-5 w-5 text-green-500" />
            <span className="ml-2 text-sm font-medium text-neutral-700">Medications</span>
          </div>
          <span className="text-sm text-neutral-600">{getMedications() || 'None recorded'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Heart className="h-5 w-5 text-green-500" />
            <span className="ml-2 text-sm font-medium text-neutral-700">Blood Type</span>
          </div>
          <span className="text-sm text-neutral-600">{patient?.bloodType || 'Not specified'}</span>
        </div>
        
        <Link href="/patient/health-records">
          <Button variant="outline" className="w-full mt-2">
            View Complete Health Record
          </Button>
        </Link>
      </div>
    </div>
  );
}

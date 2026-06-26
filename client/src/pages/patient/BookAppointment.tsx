
import { useParams } from 'wouter';
import { TelemedAppointment } from '@/components/appointment/TelemedAppointment';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function BookAppointment() {
  const params = useParams();
  const doctorId = params.doctorId;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <TelemedAppointment doctorId={doctorId} />
      </main>
      <Footer />
    </div>
  );
}

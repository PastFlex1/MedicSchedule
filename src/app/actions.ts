'use server';

import type { ConfirmAppointmentOutput } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: Date; doctor: { id: string; name: string; specialty: string; }; patientId: string;}
): Promise<ConfirmAppointmentOutput> {

  const { patientId, doctor, appointmentDate } = appointmentDetails;

  try {
    // Note: The status is set to 'pending' to require doctor's approval.
    // Change to 'approved' for instant confirmation.
    await addDoc(collection(db, "appointments"), {
        ...formData,
        appointmentDate: Timestamp.fromDate(appointmentDate),
        doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
        },
        patientId: patientId, // In a real app, this would be the authenticated user's ID
        status: 'pending', 
        createdAt: Timestamp.now()
    });
    
    return {
        confirmationStatus: true,
        reason: "Su solicitud ha sido enviada. El doctor la revisará y recibirá una notificación cuando sea aprobada.",
    };

  } catch (error) {
    console.error("Error creating appointment request:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error al procesar su solicitud. Por favor, inténtelo de nuevo más tarde.",
    };
  }
}


export async function handleCancelAppointment(appointmentId: string, doctorId: string, appointmentDate: Date): Promise<{ success: boolean; message: string }> {
  if (!appointmentId || !doctorId || !appointmentDate) {
    return { success: false, message: "Faltan datos para la cancelación." };
  }

  try {
    // 1. Delete the appointment document
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentRef);

    // 2. Re-create the available slot
    // This creates a unique ID based on doctor and time to prevent duplicates
    const slotId = `${doctorId}_${appointmentDate.toISOString()}`;
    const slotRef = doc(db, "appointmentSlots", slotId);
    
    // Check if the slot already exists to avoid accidental overwrites
    const slotSnap = await getDoc(slotRef);
    if (!slotSnap.exists()) {
       await setDoc(slotRef, {
        doctorId: doctorId,
        date: Timestamp.fromDate(appointmentDate)
      });
    }

    return { success: true, message: "La cita ha sido cancelada exitosamente." };
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, message: "Ocurrió un error al cancelar la cita." };
  }
}
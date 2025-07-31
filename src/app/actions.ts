'use server';

import { confirmAppointment, type ConfirmAppointmentInput, type ConfirmAppointmentOutput } from '@/ai/flows/smart-appointment-confirmation';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: string; appointmentTime: string; doctorName: string; }
): Promise<ConfirmAppointmentOutput> {

  const input: ConfirmAppointmentInput = {
    ...formData,
    ...appointmentDetails,
  };

  try {
    // Replaced AI flow with local confirmation
    const result = await confirmAppointment(input);
    return result;
  } catch (error) {
    console.error("Error during local appointment confirmation:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error al procesar su solicitud. Por favor, inténtelo de nuevo más tarde.",
    };
  }
}

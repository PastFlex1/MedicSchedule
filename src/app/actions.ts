'use server';

import { confirmAppointment, type ConfirmAppointmentInput, type ConfirmAppointmentOutput } from '@/ai/flows/smart-appointment-confirmation';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: string; appointmentTime: string; doctorName: string; }
): Promise<ConfirmAppointmentOutput> {
  const availabilityCalendar = `
    Calendario de Disponibilidad de Doctores:
    - Dra. Sarah Johnson: Disponible el 2024-10-26 de 09:00 a 12:00 y de 14:00 a 17:00. No disponible los fines de semana.
    - Dr. Mark Smith: Disponible el 2024-10-28 de 10:00 a 13:00.
    - Dra. Emily White: Agenda completa para las próximas dos semanas.
    - Dr. David Chen: Disponible el 2024-10-26 de 10:00 a 15:00.
  `;

  const input: ConfirmAppointmentInput = {
    ...formData,
    ...appointmentDetails,
    availabilityCalendar,
  };

  try {
    const result = await confirmAppointment(input);
    return result;
  } catch (error) {
    console.error("Error al llamar al flujo de IA:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error interno. Por favor, inténtelo de nuevo más tarde.",
    };
  }
}

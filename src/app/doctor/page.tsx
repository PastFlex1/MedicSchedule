import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Stethoscope, LogOut, User, Calendar, Clock, Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
            MediSchedule - Portal del Doctor
          </h1>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/login">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Link>
        </Button>
      </div>
    </header>
  );
}

const pendingAppointments = [
    { id: '1', patientName: 'Carlos Ramirez', date: '2024-10-26', time: '14:30', reason: 'Chequeo general' },
    { id: '2', patientName: 'Ana Torres', date: '2024-10-26', time: '15:00', reason: 'Resultados de análisis' },
    { id: '3', patientName: 'Luisa Fernandez', date: '2024-10-27', time: '10:00', reason: 'Dolor de espalda' },
];


export default function DoctorPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Citas Pendientes</CardTitle>
            <CardDescription>Revise, confirme o rechace las nuevas solicitudes de citas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.patientName}</TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>{appointment.time}</TableCell>
                    <TableCell>{appointment.reason}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                        <Check className="h-4 w-4" />
                      </Button>
                       <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                        <X className="h-4 w-4" />
                      </Button>
                       <Button variant="outline" size="icon" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white">
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

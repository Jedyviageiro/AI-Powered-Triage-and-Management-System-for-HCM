import DoctorPage from "../DoctorPage";
import { DoctorWaitingQueueView } from "../doctor-waitingqueue/DoctorWaitingQueue";

export function DoctorPacientesView(props) {
  return (
    <DoctorWaitingQueueView
      {...props}
      title="Meus Pacientes"
      subtitle="Pacientes atribuidos a si"
    />
  );
}

export default function DoctorPacientes() {
  return <DoctorPage forcedView="myPatients" />;
}

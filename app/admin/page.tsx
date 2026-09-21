import { redirect } from "next/navigation";
import { getAppSession } from "../../lib/auth";
import AdminUsers from "./AdminUsers";
export default async function AdminPage(){
  const session=await getAppSession().catch(()=>null); if(!session) redirect("/login"); if(session.role!=="ADMIN") redirect("/");
  return <AdminUsers currentEmail={session.email}/>;
}

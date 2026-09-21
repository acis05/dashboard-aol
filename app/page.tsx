import { redirect } from "next/navigation";
import Dashboard from "./components/Dashboard";
import { getAppSession } from "../lib/auth";
export const dynamic="force-dynamic";
export default async function Home(){
  const session=await getAppSession().catch(()=>null);
  if(!session) redirect('/login');
  return <Dashboard appUser={{email:session!.email,role:session!.role}}/>;
}

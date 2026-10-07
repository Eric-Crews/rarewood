import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {isAdmin,adminIdentity,adminPasswordConfigured} from '@/lib/auth';
import {AdminLoader} from '@/components/site/admin-loader';
import {AdminPasswordForm} from '@/components/site/admin-password';
export const dynamic='force-dynamic';
export const metadata={title:'Publisher Workspace',robots:{index:false,follow:false}};
// Keep the growing content library out of the server-rendered React payload.
// Both this page and the JSON data endpoint enforce the existing admin checks.
export default async function Admin(){await requireChatGPTUser('/admin');if(!await adminIdentity())return <main id="main" className="section empty-page"><h1>Publisher access required.</h1><p>This workspace is available to the authorized platform operator.</p></main>;if(!await isAdmin())return <main id="main" className="section admin-password-page"><AdminPasswordForm configured={adminPasswordConfigured()}/></main>;return <main id="main" className="admin-page section"><AdminLoader/></main>}

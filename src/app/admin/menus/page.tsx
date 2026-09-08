import { getMenuItems } from "@/lib/menus";
import { MenuEditor } from "./menu-editor";

export default async function AdminMenusPage() {
  const [header, footer] = await Promise.all([
    getMenuItems("header"),
    getMenuItems("footer"),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Menus</h1>
      <MenuEditor menuKey="header" title="Header" initialItems={header} />
      <MenuEditor menuKey="footer" title="Footer" initialItems={footer} />
    </div>
  );
}

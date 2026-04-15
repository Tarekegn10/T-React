import { Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OrganizationSettings() {
  return (
    <Card className="gap-0">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Organization</CardTitle>
        </div>
        <CardDescription>Manage your organization details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" defaultValue="FriEL Ethiopia Farming and Processing PLC" className="bg-muted/50" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input id="contact-email" defaultValue=" frielvh@gmail.com" className="bg-muted/50" readOnly />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" defaultValue="Kirkos sub-city, Woreda 2, Gabon Street,
          Meskel Flower behind Arsho Medical Center, Addis Ababa, Ethiopia" className="bg-muted/50" readOnly />
        </div>
      </CardContent>
    </Card>
  )
}

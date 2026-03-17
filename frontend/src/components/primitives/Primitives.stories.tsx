import type { Meta, StoryObj } from "@storybook/react"
import { Button, Input, Badge, Avatar, Tooltip, Spinner, Skeleton, Divider, Switch, Checkbox, Dropdown, ToastContainer, Modal, Kbd } from "./index"
import { useState } from "react"

const meta: Meta = {
  title: "Primitives/All",
  parameters: { layout: "centered" }
}

export default meta

export const All: StoryObj = {
  render: () => {
    const [checked, setChecked] = useState(true)
    const [open, setOpen] = useState(true)
    return (
      <div style={{ display: "grid", gap: 16, padding: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
        <Input label="Default" value="" onChange={() => {}} />
        <div style={{ display: "flex", gap: 8 }}>
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Avatar name="Student" size="sm" />
          <Avatar name="Student" size="md" online />
        </div>
        <Tooltip content="Tooltip text"><Button variant="secondary">Hover</Button></Tooltip>
        <Spinner size={20} />
        <Skeleton width={240} height={14} />
        <Divider />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Switch checked={checked} onChange={setChecked} />
          <Checkbox checked={checked} onChange={setChecked} />
          <Kbd>Cmd+K</Kbd>
        </div>
        <Dropdown trigger={<Button variant="secondary">Menu</Button>}>
          <div>Profile</div>
          <div>Settings</div>
        </Dropdown>
        <ToastContainer toasts={[{ id: "1", message: "Saved", variant: "success" }]} />
        <Modal open={open} onClose={() => setOpen(false)}>
          Modal content
        </Modal>
      </div>
    )
  }
}

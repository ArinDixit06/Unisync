import type { Meta, StoryObj } from "@storybook/react"
import { LaunchSecurityHighlights } from "./LaunchSecurityHighlights"

const meta: Meta<typeof LaunchSecurityHighlights> = {
  title: "Launch/LaunchSecurityHighlights",
  component: LaunchSecurityHighlights,
  parameters: {
    layout: "fullscreen"
  }
}

export default meta

type Story = StoryObj<typeof LaunchSecurityHighlights>

export const Default: Story = {}

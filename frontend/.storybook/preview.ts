import type { Preview } from "@storybook/react"
import "../src/styles/global.css"

const preview: Preview = {
  parameters: {
    themes: {
      default: "Light",
      list: [
        { name: "Light", class: "", color: "#f6f4f0" },
        { name: "Dark", class: "dark", color: "#0b0f12" }
      ]
    }
  }
}

export default preview

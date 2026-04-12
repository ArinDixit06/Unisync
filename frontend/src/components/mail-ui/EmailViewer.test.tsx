import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EmailViewer } from "./EmailViewer"

describe("EmailViewer", () => {
  it("strips centered layout constraints from the rendered email html", () => {
    const { container } = render(
      <EmailViewer
        email={{
          body_html: '<div style="max-width: 640px; margin: 0 auto;"><p>Body</p></div>'
        }}
      />
    )

    const wrapper = container.querySelector(".email-html > div > div")

    expect(wrapper).not.toBeNull()
    expect(wrapper).toHaveStyle({
      width: "100%",
      maxWidth: "none",
      marginLeft: "0px",
      marginRight: "0px"
    })
  })
})

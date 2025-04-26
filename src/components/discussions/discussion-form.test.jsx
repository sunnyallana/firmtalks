import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiscussionForm } from "./discussion-form";

describe("DiscussionForm", () => {
  const mockSubmit = vi.fn();

  it("renders the form with all fields", () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Content")).toBeInTheDocument();
    expect(screen.getByLabelText("Tags")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create discussion/i }),
    ).toBeInTheDocument();
  });

  it("shows create button when not in edit mode", () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);
    expect(
      screen.getByRole("button", { name: /create discussion/i }),
    ).toBeInTheDocument();
  });

  it("shows update button when in edit mode", () => {
    render(<DiscussionForm onSubmit={mockSubmit} isEditing />);
    expect(
      screen.getByRole("button", { name: /update discussion/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills form when initialValues are provided", () => {
    const initialValues = {
      title: "Test Title",
      content: "Test content that is long enough",
      tags: "test,tag",
    };
    render(
      <DiscussionForm onSubmit={mockSubmit} initialValues={initialValues} />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue(initialValues.title);
    expect(screen.getByLabelText("Content")).toHaveValue(initialValues.content);
    expect(screen.getByLabelText("Tags")).toHaveValue(initialValues.tags);
  });

  it("shows validation errors when required fields are empty", async () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: /create discussion/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Title must be at least 10 characters"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Content must be at least 30 characters"),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when title is too short", async () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Title"), "Short");
    await user.click(
      screen.getByRole("button", { name: /create discussion/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Title must be at least 10 characters"),
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when content is too short", async () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Content"), "Short content");
    await user.click(
      screen.getByRole("button", { name: /create discussion/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Content must be at least 30 characters"),
      ).toBeInTheDocument();
    });
  });

  it("submits the form with valid data", async () => {
    render(<DiscussionForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.type(
      screen.getByLabelText("Title"),
      "This is a valid title that is long enough",
    );
    await user.type(
      screen.getByLabelText("Content"),
      "This is valid content that is definitely longer than 30 characters as required",
    );
    await user.type(screen.getByLabelText("Tags"), "tag1,tag2");
    await user.click(
      screen.getByRole("button", { name: /create discussion/i }),
    );

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        {
          title: "This is a valid title that is long enough",
          content:
            "This is valid content that is definitely longer than 30 characters as required",
          tags: "tag1,tag2",
        },
        expect.anything(),
      );
    });
  });

  it("disables the submit button while submitting", async () => {
    mockSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000)),
    );
    render(<DiscussionForm onSubmit={mockSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Title"), "Valid title length here");
    await user.type(
      screen.getByLabelText("Content"),
      "Valid content length here that is more than 30 characters",
    );
    const submitButton = screen.getByRole("button", {
      name: /create discussion/i,
    });

    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    await waitFor(() => expect(submitButton).toBeEnabled());
  });
});

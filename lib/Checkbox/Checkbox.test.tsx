import classNames from "classnames";
import type { FormEvent, FormEventHandler } from "react";
import {
  act,
  itShouldMount,
  itSupportsDataSetProps,
  itSupportsFocusEvents,
  itSupportsRef,
  itSupportsStyle,
  render,
  screen,
  userEvent,
} from "../../tests/utils";
import Checkbox, { type Props } from "./Checkbox";

const labelText = "Label";

const mockRequiredProps: Props = {
  label: { screenReaderLabel: labelText },
};

describe("Checkbox", () => {
  afterEach(jest.clearAllMocks);

  itShouldMount(Checkbox, mockRequiredProps);
  itSupportsStyle(Checkbox, mockRequiredProps);
  itSupportsRef(Checkbox, mockRequiredProps, HTMLButtonElement);
  itSupportsFocusEvents(Checkbox, mockRequiredProps, "button");
  itSupportsDataSetProps(Checkbox, mockRequiredProps);

  it("should have the required classNames", () => {
    const { unmount } = render(
      <Checkbox
        {...mockRequiredProps}
        checked
        autoFocus
        disabled
        readOnly
        className={({
          checked,
          disabled,
          readOnly,
          focusedVisible,
          indeterminate,
        }) =>
          classNames("root", {
            "root--disabled": disabled,
            "root--readonly": readOnly,
            "root--checked": checked,
            "root--focus-visible": focusedVisible,
            "root--indeterminate": indeterminate,
          })
        }
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveClass(
      "root",
      "root--checked",
      "root--disabled",
      "root--readonly",
    );

    unmount();
    const { rerender } = render(
      <Checkbox
        {...mockRequiredProps}
        checked
        autoFocus
        readOnly
        className={({
          checked,
          disabled,
          readOnly,
          focusedVisible,
          indeterminate,
        }) =>
          classNames("root", {
            "root--disabled": disabled,
            "root--readonly": readOnly,
            "root--checked": checked,
            "root--focus-visible": focusedVisible,
            "root--indeterminate": indeterminate,
          })
        }
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveClass(
      "root",
      "root--checked",
      "root--focus-visible",
      "root--readonly",
    );

    rerender(
      <Checkbox
        {...mockRequiredProps}
        checked="indeterminate"
        aria-controls="id1"
        className={({
          checked,
          disabled,
          readOnly,
          focusedVisible,
          indeterminate,
        }) =>
          classNames("root", {
            "root--disabled": disabled,
            "root--readonly": readOnly,
            "root--checked": checked,
            "root--focus-visible": focusedVisible,
            "root--indeterminate": indeterminate,
          })
        }
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveClass(
      "root",
      "root--indeterminate",
    );
  });

  it("should have `aria-label='label'` property when `label={{ screenReaderLabel: 'label' }}`", () => {
    render(<Checkbox {...mockRequiredProps} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-label",
      labelText,
    );
  });

  it("should have `aria-labelledby='identifier'` property when `label={{ labelledBy: 'identifier' }}`", () => {
    render(
      <Checkbox
        {...mockRequiredProps}
        label={{ labelledBy: "identifier" }}
      />,
    );

    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-labelledby",
      "identifier",
    );
  });

  it("renders a mixed checkbox with correct behavior", async () => {
    userEvent.setup();
    render(
      <Checkbox
        {...mockRequiredProps}
        defaultChecked="indeterminate"
        aria-controls="id1 id2"
      />,
    );

    const checkbox = screen.getByRole("checkbox");

    expect(checkbox).not.toBeChecked();
    // eslint-disable-next-line jest-dom/prefer-checked
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("renders an unchecked checkbox when `checked={false}`", () => {
    render(<Checkbox {...mockRequiredProps} />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("renders a checked checkbox when `checked={true}`", () => {
    render(
      <Checkbox
        {...mockRequiredProps}
        checked
      />,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("toggles `checked` state with mouse/keyboard interactions and calls `onCheckedChange` callback", async () => {
    const handleCheckedChange = jest.fn<void, [checkedState: boolean]>();

    userEvent.setup();

    const getCheckbox = () => screen.getByRole("checkbox");

    const { unmount: unmount1 } = render(
      <Checkbox
        {...mockRequiredProps}
        onCheckedChange={handleCheckedChange}
      />,
    );

    await userEvent.click(getCheckbox());

    expect(getCheckbox()).toBeChecked();
    expect(handleCheckedChange.mock.calls.length).toBe(1);
    expect(handleCheckedChange.mock.calls[0]?.[0]).toBe(true);

    await userEvent.click(getCheckbox());

    expect(getCheckbox()).not.toBeChecked();
    expect(handleCheckedChange.mock.calls.length).toBe(2);
    expect(handleCheckedChange.mock.calls[1]?.[0]).toBe(false);

    handleCheckedChange.mockReset();
    unmount1();
    const { unmount: unmount2 } = render(
      <Checkbox
        {...mockRequiredProps}
        onCheckedChange={handleCheckedChange}
      />,
    );

    await userEvent.tab();

    expect(getCheckbox()).toHaveFocus();

    await userEvent.keyboard("[Space]");

    expect(getCheckbox()).toBeChecked();
    expect(handleCheckedChange.mock.calls.length).toBe(1);
    expect(handleCheckedChange.mock.calls[0]?.[0]).toBe(true);

    await userEvent.keyboard("[Space]");

    expect(getCheckbox()).not.toBeChecked();
    expect(handleCheckedChange.mock.calls.length).toBe(2);
    expect(handleCheckedChange.mock.calls[1]?.[0]).toBe(false);

    handleCheckedChange.mockReset();
    unmount2();
    const { unmount: unmount3 } = render(
      <Checkbox
        {...mockRequiredProps}
        readOnly
        onCheckedChange={handleCheckedChange}
      />,
    );

    await userEvent.tab();

    expect(getCheckbox()).toHaveFocus();

    await userEvent.keyboard("[Space]");

    expect(handleCheckedChange.mock.calls.length).toBe(0);

    await userEvent.keyboard("[Enter]");

    expect(handleCheckedChange.mock.calls.length).toBe(0);

    await userEvent.click(getCheckbox());

    expect(handleCheckedChange.mock.calls.length).toBe(0);

    handleCheckedChange.mockReset();
    unmount3();
    render(
      <Checkbox
        {...mockRequiredProps}
        disabled
        onCheckedChange={handleCheckedChange}
      />,
    );

    await userEvent.tab();

    expect(getCheckbox()).not.toHaveFocus();

    await userEvent.click(getCheckbox());

    expect(handleCheckedChange.mock.calls.length).toBe(0);
  });

  it("should be submitted with the form as part of a name/value pair", () => {
    const handleSubmit = jest.fn<void, [FormEvent<HTMLFormElement>]>();

    const submitHandler: FormEventHandler<HTMLFormElement> = event => {
      event.preventDefault();
      handleSubmit(event);
    };

    const getForm = () => screen.getByTestId<HTMLFormElement>("form");
    const getFormData = () => new FormData(getForm());

    const { rerender } = render(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Checkbox
          {...mockRequiredProps}
          checked={false}
          name="n"
          value="v0"
        />
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(1);
    expect(getFormData().get("n")).toBe(null);

    rerender(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Checkbox
          {...mockRequiredProps}
          checked={true}
          name="n"
          value="v0"
        />
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(2);
    expect(getFormData().get("n")).toBe("v0");

    rerender(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Checkbox
          {...mockRequiredProps}
          disabled
          checked={true}
          name="n"
          value="v0"
        />
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(3);
    expect(getFormData().get("n")).toBe(null);
  });
});

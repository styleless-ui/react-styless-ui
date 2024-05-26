import classNames from "classnames";
import type { FormEvent, FormEventHandler } from "react";
import {
  act,
  itShouldMount,
  itSupportsDataSetProps,
  itSupportsRef,
  itSupportsStyle,
  render,
  screen,
  userEvent,
} from "../../tests/utils";
import * as Select from "./index";
import { Root as RootSlot } from "./slots";

describe("Select", () => {
  afterEach(jest.clearAllMocks);

  const mockRequiredProps: Select.RootProps = {
    label: { screenReaderLabel: "Label" },
    multiple: false,
  };

  itShouldMount(Select.Root, mockRequiredProps);
  itSupportsStyle(Select.Root, mockRequiredProps, `[data-slot='${RootSlot}']`);
  itSupportsRef(Select.Root, mockRequiredProps, HTMLDivElement);
  itSupportsDataSetProps(
    Select.Root,
    mockRequiredProps,
    `[data-slot='${RootSlot}']`,
  );

  it("should have the required className", async () => {
    const optionClassName = ({
      active,
      disabled,
      selected,
      hidden,
    }: Select.OptionClassNameProps) =>
      classNames("option", {
        "option--disabled": disabled,
        "option--active": active,
        "option--selected": selected,
        "option--hidden": hidden,
      });

    userEvent.setup();

    render(
      <Select.Root
        data-testid="root"
        defaultOpen
        defaultValue={["0", "1"]}
        className={({
          disabled,
          open,
          readOnly,
          hasSelectedValues,
          multiple,
          searchable,
        }) =>
          classNames("root", {
            "root--disabled": disabled,
            "root--open": open,
            "root--readonly": readOnly,
            "root--has-values": hasSelectedValues,
            "root--multiple": multiple,
            "root--searchable": searchable,
          })
        }
        multiple
        searchable
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger
          data-testid="trigger"
          className="trigger"
        >
          <Select.Controller
            autoFocus
            data-testid="controller"
            className={({ focusedVisible }) =>
              classNames("controller", {
                "controller--focus-visible": focusedVisible,
              })
            }
            placeholder="Placeholder"
          />
        </Select.Trigger>
        <Select.List
          data-testid="list"
          className={({ open }) => classNames("list", { "list--open": open })}
        >
          <Select.EmptyStatement
            data-testid="empty-statement"
            className="empty-statement"
          >
            No option found!
          </Select.EmptyStatement>
          <Select.Option
            data-testid="o1"
            disabled
            className={optionClassName}
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            className={({ hidden }) =>
              classNames("group", { "group--hidden": hidden })
            }
            label={{ labelledBy: "g1" }}
          >
            <span id="g1">Godfathers</span>
            <Select.Option
              data-testid="o2"
              className={optionClassName}
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              className={optionClassName}
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
          <Select.Option
            data-testid="o4"
            className={optionClassName}
            value="3"
            valueLabel="Schindler's List"
          >
            {"Schindler's List"}
          </Select.Option>
          <Select.Option
            data-testid="o5"
            className={optionClassName}
            value="4"
            valueLabel="Pulp Fiction"
          >
            {"Pulp Fiction"}
          </Select.Option>
        </Select.List>
      </Select.Root>,
    );

    const root = screen.getByTestId("root");
    const trigger = screen.getByTestId("trigger");
    const controller = screen.getByTestId("controller");
    const list = screen.getByTestId("list");
    const group = screen.getByTestId("group");
    const option1 = screen.getByTestId("o1");
    const option2 = screen.getByTestId("o2");

    expect(root).toHaveClass(
      "root",
      "root--open",
      "root--multiple",
      "root--searchable",
    );

    expect(trigger).toHaveClass("trigger");
    expect(controller).toHaveClass("controller", "controller--focus-visible");
    expect(list).toHaveClass("list", "list--open");
    expect(group).toHaveClass("group");
    expect(option1).toHaveClass(
      "option",
      "option--disabled",
      "option--selected",
    );
    expect(option2).toHaveClass("option", "option--selected");

    await userEvent.type(controller, "xyz");

    expect(screen.getByTestId("group")).toHaveClass("group", "group--hidden");
  });

  it("should have the required attributes", () => {
    render(
      <Select.Root
        data-testid="root"
        defaultOpen
        defaultValue={["0", "1"]}
        multiple
        searchable
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller
            autoFocus
            data-testid="controller"
          />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.EmptyStatement data-testid="empty-statement">
            No options found!
          </Select.EmptyStatement>
          <Select.Option
            data-testid="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    const controller = screen.getByTestId("controller");
    const list = screen.getByTestId("list");
    const group = screen.getByTestId("group");
    const option1 = screen.getByTestId("o1");
    const option2 = screen.getByTestId("o2");

    expect(controller).toHaveAttribute("aria-expanded", "true");
    expect(controller).toHaveAttribute("aria-haspopup", "listbox");
    expect(controller).toHaveAttribute("aria-label", "Label");
    expect(controller).toHaveAttribute("aria-autocomplete", "list");
    expect(controller).toHaveAttribute("aria-controls");
    expect(controller).toHaveAttribute("data-focus-visible");

    expect(list).toHaveAttribute("data-open");

    expect(group).toHaveAttribute("aria-label", "Group");
    expect(group).toHaveAttribute("aria-hidden", "false");

    expect(option1).toHaveAttribute("aria-label", "The Shawshank Redemption");
    expect(option1).toHaveAttribute("aria-hidden", "false");
    expect(option1).toHaveAttribute("aria-disabled", "true");
    expect(option1).toHaveAttribute("aria-selected", "true");

    expect(option2).toHaveAttribute("aria-label", "The Godfather");
    expect(option2).toHaveAttribute("aria-hidden", "false");
    expect(option2).toHaveAttribute("aria-disabled", "false");
    expect(option2).toHaveAttribute("aria-selected", "true");
  });

  it("should properly move the active element by keyboard", async () => {
    const { unmount } = render(
      <Select.Root
        data-testid="root"
        searchable
        multiple={false}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.tab();

    expect(screen.getByTestId("controller")).toHaveFocus();
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Escape]");

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Escape]");

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[Space]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).not.toHaveAttribute(
      "aria-activedescendant",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[Home]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[End]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    unmount();
    render(
      <Select.Root
        data-testid="root"
        searchable={false}
        multiple={true}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.tab();

    expect(screen.getByTestId("controller")).toHaveFocus();
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Escape]");

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Escape]");

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[Space]");

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("controller")).not.toHaveAttribute(
      "aria-activedescendant",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[Home]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[End]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[KeyT]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );
  });

  it("should properly select the active element by keyboard", async () => {
    const handleValueChange = jest.fn<void, [string | string[]]>();

    const { unmount } = render(
      <Select.Root
        onValueChange={handleValueChange}
        data-testid="root"
        searchable
        multiple={false}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.tab();

    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Enter]");

    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toBe("1");

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[Enter]");

    expect(handleValueChange.mock.calls.length).toBe(2);
    expect(handleValueChange.mock.calls[1]?.[0]).toBe("2");

    await userEvent.keyboard("[Enter]");

    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "true");

    unmount();
    handleValueChange.mockReset();

    render(
      <Select.Root
        onValueChange={handleValueChange}
        data-testid="root"
        searchable={false}
        multiple={true}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.tab();

    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.keyboard("[Enter]");

    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toEqual(["1"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.keyboard("[Enter]");

    expect(handleValueChange.mock.calls.length).toBe(2);
    expect(handleValueChange.mock.calls[1]?.[0]).toEqual(["1", "2"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("[Home]");
    await userEvent.keyboard("[Enter]");

    expect(handleValueChange.mock.calls.length).toBe(3);
    expect(handleValueChange.mock.calls[2]?.[0]).toEqual(["2"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("[Backspace]");

    expect(handleValueChange.mock.calls.length).toBe(4);
    expect(handleValueChange.mock.calls[3]?.[0]).toEqual([]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "false");
  });

  it("should be correctly interactive with mouse", async () => {
    const handleValueChange = jest.fn<void, [string | string[]]>();

    const { unmount } = render(
      <Select.Root
        onValueChange={handleValueChange}
        data-testid="root"
        searchable
        multiple={false}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.click(screen.getByTestId("trigger"));
    await userEvent.hover(screen.getByTestId("o2"));

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o2",
    );

    await userEvent.click(screen.getByTestId("o2"));

    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toBe("1");
    expect(screen.queryByTestId("list")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("controller"));

    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByTestId("o3"));

    expect(handleValueChange.mock.calls.length).toBe(2);
    expect(handleValueChange.mock.calls[1]?.[0]).toBe("2");

    unmount();
    handleValueChange.mockReset();

    render(
      <Select.Root
        onValueChange={handleValueChange}
        data-testid="root"
        searchable={false}
        multiple={true}
        label={{ screenReaderLabel: "Label" }}
      >
        <Select.Trigger data-testid="trigger">
          <Select.Controller data-testid="controller" />
        </Select.Trigger>
        <Select.List data-testid="list">
          <Select.Option
            data-testid="o1"
            id="o1"
            disabled
            value="0"
            valueLabel="The Shawshank Redemption"
          >
            The Shawshank Redemption
          </Select.Option>
          <Select.Group
            data-testid="group"
            label={{ screenReaderLabel: "Group" }}
          >
            <Select.Option
              data-testid="o2"
              id="o2"
              value="1"
              valueLabel="The Godfather"
            >
              The Godfather
            </Select.Option>
            <Select.Option
              data-testid="o3"
              id="o3"
              value="2"
              valueLabel="The Godfather: Part 2"
            >
              The Godfather: Part 2
            </Select.Option>
          </Select.Group>
        </Select.List>
      </Select.Root>,
    );

    await userEvent.click(screen.getByTestId("trigger"));
    await userEvent.click(screen.getByTestId("o2"));

    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toEqual(["1"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");

    await userEvent.hover(screen.getByTestId("o3"));

    expect(screen.getByTestId("controller")).toHaveAttribute(
      "aria-activedescendant",
      "o3",
    );

    await userEvent.click(screen.getByTestId("o3"));

    expect(handleValueChange.mock.calls.length).toBe(2);
    expect(handleValueChange.mock.calls[1]?.[0]).toEqual(["1", "2"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByTestId("o2"));

    expect(handleValueChange.mock.calls.length).toBe(3);
    expect(handleValueChange.mock.calls[2]?.[0]).toEqual(["2"]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByTestId("o3"));

    expect(handleValueChange.mock.calls.length).toBe(4);
    expect(handleValueChange.mock.calls[3]?.[0]).toEqual([]);
    expect(screen.getByTestId("o2")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("o3")).toHaveAttribute("aria-selected", "false");

    await userEvent.click(screen.getByTestId("o1"));

    expect(handleValueChange.mock.calls.length).toBe(4);
  });

  it("should be submitted with the form as part of a name/value pair", () => {
    const handleSubmit = jest.fn<void, [FormEvent<HTMLFormElement>]>();

    const submitHandler: FormEventHandler<HTMLFormElement> = event => {
      event.preventDefault();
      handleSubmit(event);
    };

    const getForm = () => screen.getByTestId<HTMLFormElement>("form");
    const getFormData = () => new FormData(getForm());

    const { rerender: rerender1, unmount } = render(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={true}
          label={{ screenReaderLabel: "Label" }}
          value={[]}
          name="n"
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(1);
    expect(getFormData().get("n")).toBe(null);
    expect(getFormData().getAll("n")).toEqual([]);

    rerender1(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={true}
          label={{ screenReaderLabel: "Label" }}
          value={["0", "1"]}
          name="n"
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(2);
    expect(getFormData().getAll("n")).toEqual(["0", "1"]);

    rerender1(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={true}
          label={{ screenReaderLabel: "Label" }}
          value={["0", "1", "2"]}
          name="n"
          disabled
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(3);
    expect(getFormData().getAll("n")).toEqual([]);

    handleSubmit.mockReset();
    unmount();
    const { rerender: rerender2 } = render(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={false}
          label={{ screenReaderLabel: "Label" }}
          value={""}
          name="n"
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(1);
    expect(getFormData().get("n")).toBe(null);

    rerender2(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={false}
          label={{ screenReaderLabel: "Label" }}
          value={"0"}
          name="n"
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(2);
    expect(getFormData().get("n")).toBe("0");

    rerender2(
      <form
        data-testid="form"
        onSubmit={submitHandler}
      >
        <Select.Root
          searchable={true}
          multiple={false}
          label={{ screenReaderLabel: "Label" }}
          value={"1"}
          name="n"
        >
          <Select.Trigger>
            <Select.Controller />
          </Select.Trigger>
          <Select.List>
            <Select.Option
              id="o1"
              disabled
              value="0"
              valueLabel="The Shawshank Redemption"
            >
              The Shawshank Redemption
            </Select.Option>
            <Select.Group label={{ screenReaderLabel: "Group" }}>
              <Select.Option
                id="o2"
                value="1"
                valueLabel="The Godfather"
              >
                The Godfather
              </Select.Option>
              <Select.Option
                id="o3"
                value="2"
                valueLabel="The Godfather: Part 2"
              >
                The Godfather: Part 2
              </Select.Option>
            </Select.Group>
          </Select.List>
        </Select.Root>
      </form>,
    );

    act(() => {
      getForm().submit();
    });

    expect(handleSubmit.mock.calls.length).toBe(3);
    expect(getFormData().get("n")).toBe("1");
  });
});

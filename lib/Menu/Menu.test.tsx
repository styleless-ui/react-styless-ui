import classNames from "classnames";
import {
  itShouldMount,
  itSupportsDataSetProps,
  itSupportsRef,
  itSupportsStyle,
  render,
  screen,
  userEvent,
} from "../../tests/utils";
import { createVirtualElement } from "../utils";
import * as Menu from "./index";

describe("Menu", () => {
  afterEach(jest.clearAllMocks);

  const requiredProps: Menu.RootProps = {
    open: true,
    label: { screenReaderLabel: "label" },
    onClose: () => void 0,
    resolveAnchor: () => createVirtualElement(0, 0, 0, 0),
  };

  itShouldMount(Menu.Root, requiredProps);
  itSupportsStyle(Menu.Root, requiredProps, "[role='menu']", {
    withPortal: true,
  });
  itSupportsRef(Menu.Root, requiredProps, HTMLDivElement);
  itSupportsDataSetProps(Menu.Root, requiredProps, "[role='menu']", {
    withPortal: true,
  });

  it("should have the required classNames", async () => {
    const itemClassName: Menu.ItemProps["className"] = ({
      active,
      disabled,
      expandable,
      expanded,
    }) =>
      classNames("menu__item", {
        "menu__item--active": active,
        "menu__item--disabled": disabled,
        "menu__item--expandable": expandable,
        "menu__item--expanded": expanded,
      });

    const radioClassName: Menu.RadioItemProps["className"] = ({
      active,
      disabled,
      checked,
    }) =>
      classNames("menu__radio-item", {
        "menu__radio-item--active": active,
        "menu__radio-item--disabled": disabled,
        "menu__radio-item--checked": checked,
      });

    const checkClassName: Menu.CheckItemProps["className"] = ({
      active,
      disabled,
      checked,
    }) =>
      classNames("menu__check-item", {
        "menu__check-item--active": active,
        "menu__check-item--disabled": disabled,
        "menu__check-item--checked": checked,
      });

    const subMenuClassName: Menu.SubMenuProps["className"] = ({ open }) =>
      classNames("menu__submenu", {
        "menu__submenu--open": open,
      });

    const groupClassName = "menu__group";
    const radioGroupClassName = groupClassName;
    const separatorClassName = "menu__separator-item";

    render(
      <>
        <button id="anchor">anchor</button>
        <Menu.Root
          className={({ open }) => classNames("menu", { "menu--open": open })}
          label={{ screenReaderLabel: "Menu" }}
          open={true}
          onClose={() => void 0}
          resolveAnchor={() => document.getElementById("anchor")}
        >
          <Menu.Group
            className={groupClassName}
            label={{ screenReaderLabel: "G1" }}
            data-testid="g1"
          >
            <Menu.Item
              className={itemClassName}
              data-testid="i1"
              subMenu={
                <Menu.SubMenu
                  data-testid="m1"
                  className={subMenuClassName}
                >
                  <Menu.Item
                    data-testid="m1i1"
                    className={itemClassName}
                  >
                    New Tab
                  </Menu.Item>
                  <Menu.Item
                    data-testid="m1i2"
                    className={itemClassName}
                  >
                    New Window
                  </Menu.Item>
                </Menu.SubMenu>
              }
            >
              {({ expanded }) => <>More Tools {expanded ? "-" : "+"}</>}
            </Menu.Item>
          </Menu.Group>
          <Menu.SeparatorItem
            data-testid="i2"
            className={separatorClassName}
          />
          <Menu.Group
            className={groupClassName}
            data-testid="g2"
            label={{ screenReaderLabel: "G2" }}
          >
            <Menu.CheckItem
              className={checkClassName}
              value="show_bookmarks"
              data-testid="i3"
              disabled
              checked={true}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Bookmarks</>}
            </Menu.CheckItem>
            <Menu.CheckItem
              className={checkClassName}
              value="show_full_urls"
              data-testid="i4"
              checked={false}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Full URLs</>}
            </Menu.CheckItem>
          </Menu.Group>
          <Menu.SeparatorItem
            data-testid="i5"
            className={separatorClassName}
          />
          <Menu.Item
            data-testid="i6"
            disabled
            className={itemClassName}
          >
            New Window
          </Menu.Item>
          <Menu.SeparatorItem
            data-testid="i7"
            className={separatorClassName}
          />
          <Menu.RadioGroup
            className={radioGroupClassName}
            label={{ screenReaderLabel: "People" }}
            data-testid="g3"
            value="pedro"
          >
            <Menu.RadioItem
              className={radioClassName}
              data-testid="i8"
              value="pedro"
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Pedro</>}
            </Menu.RadioItem>
            <Menu.RadioItem
              className={radioClassName}
              data-testid="i9"
              value="colm"
              disabled
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Colm</>}
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Root>
      </>,
    );

    const root = screen.getByRole("menu");

    expect(root).toHaveClass("menu", "menu--open");

    expect(screen.getByTestId("g1")).toHaveClass("menu__group");
    expect(screen.getByTestId("g2")).toHaveClass("menu__group");
    expect(screen.getByTestId("g3")).toHaveClass("menu__group");

    expect(screen.getByTestId("i1")).toHaveClass(
      "menu__item",
      "menu__item--expandable",
    );

    await userEvent.hover(screen.getByTestId("i1"));

    expect(screen.getByTestId("i1")).toHaveClass(
      "menu__item",
      "menu__item--expandable",
      "menu__item--expanded",
      "menu__item--active",
    );

    expect(screen.getByTestId("m1")).toHaveClass(
      "menu__submenu",
      "menu__submenu--open",
    );

    expect(screen.getByTestId("m1i1")).toHaveClass("menu__item");
    expect(screen.getByTestId("m1i2")).toHaveClass("menu__item");

    expect(screen.getByTestId("i6")).toHaveClass(
      "menu__item",
      "menu__item--disabled",
    );

    expect(screen.getByTestId("i2")).toHaveClass("menu__separator-item");
    expect(screen.getByTestId("i5")).toHaveClass("menu__separator-item");
    expect(screen.getByTestId("i7")).toHaveClass("menu__separator-item");

    expect(screen.getByTestId("i3")).toHaveClass(
      "menu__check-item",
      "menu__check-item--checked",
      "menu__check-item--disabled",
    );

    expect(screen.getByTestId("i4")).toHaveClass("menu__check-item");

    expect(screen.getByTestId("i8")).toHaveClass(
      "menu__radio-item",
      "menu__radio-item--checked",
    );

    expect(screen.getByTestId("i9")).toHaveClass(
      "menu__radio-item",
      "menu__radio-item--disabled",
    );
  });

  it("should have the required aria attributes", async () => {
    render(
      <>
        <button id="anchor">anchor</button>
        <Menu.Root
          label={{ screenReaderLabel: "Menu" }}
          open={true}
          onClose={() => void 0}
          data-testid="root"
          resolveAnchor={() => document.getElementById("anchor")}
        >
          <Menu.Group
            label={{ screenReaderLabel: "G1" }}
            data-testid="g1"
          >
            <Menu.Item
              data-testid="i1"
              subMenu={
                <Menu.SubMenu data-testid="m1">
                  <Menu.Item data-testid="m1i1">New Tab</Menu.Item>
                  <Menu.Item data-testid="m1i2">New Window</Menu.Item>
                </Menu.SubMenu>
              }
            >
              {({ expanded }) => <>More Tools {expanded ? "-" : "+"}</>}
            </Menu.Item>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i2" />
          <Menu.Group
            data-testid="g2"
            label={{ screenReaderLabel: "G2" }}
          >
            <Menu.CheckItem
              value="show_bookmarks"
              data-testid="i3"
              disabled
              checked={true}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Bookmarks</>}
            </Menu.CheckItem>
            <Menu.CheckItem
              value="show_full_urls"
              data-testid="i4"
              checked={false}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Full URLs</>}
            </Menu.CheckItem>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i5" />
          <Menu.Item
            data-testid="i6"
            disabled
          >
            New Window
          </Menu.Item>
          <Menu.SeparatorItem data-testid="i7" />
          <Menu.RadioGroup
            label={{ screenReaderLabel: "People" }}
            data-testid="g3"
            value="pedro"
          >
            <Menu.RadioItem
              data-testid="i8"
              value="pedro"
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Pedro</>}
            </Menu.RadioItem>
            <Menu.RadioItem
              data-testid="i9"
              value="colm"
              disabled
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Colm</>}
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Root>
      </>,
    );

    expect(screen.getByTestId("root")).toHaveFocus();
    expect(screen.getByTestId("root")).toHaveAttribute("aria-label", "Menu");
    expect(screen.getByTestId("root")).toHaveAttribute("data-open");

    await userEvent.hover(screen.getByTestId("i1"));

    expect(screen.getByTestId("root")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByTestId("i1").id,
    );

    expect(screen.getByTestId("i1")).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByTestId("i1")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("i1")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.getByTestId("i1")).toHaveAttribute("data-active");
    expect(screen.getByTestId("i1")).toHaveAttribute(
      "data-entity",
      screen.getByTestId("i1").id,
    );

    expect(screen.getByTestId("m1")).toHaveAttribute(
      "aria-labelledby",
      screen.getByTestId("i1").id,
    );
    expect(screen.getByTestId("m1")).toHaveAttribute(
      "data-for-entity",
      screen.getByTestId("i1").id,
    );
    expect(screen.getByTestId("m1")).toHaveAttribute(
      "data-root-menu",
      screen.getByTestId("root").id,
    );
    expect(screen.getByTestId("m1")).toHaveAttribute("data-open");

    expect(screen.getByTestId("m1i1")).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByTestId("m1i1")).not.toHaveAttribute("aria-expanded");
    expect(screen.getByTestId("m1i1")).not.toHaveAttribute("aria-haspopup");
    expect(screen.getByTestId("m1i1")).not.toHaveAttribute("aria-active");
    expect(screen.getByTestId("m1i1")).toHaveAttribute(
      "data-entity",
      screen.getByTestId("m1i1").id,
    );
    expect(screen.getByTestId("m1i2")).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    expect(screen.getByTestId("m1i2")).not.toHaveAttribute("aria-expanded");
    expect(screen.getByTestId("m1i2")).not.toHaveAttribute("aria-haspopup");
    expect(screen.getByTestId("m1i2")).not.toHaveAttribute("aria-active");
    expect(screen.getByTestId("m1i2")).toHaveAttribute(
      "data-entity",
      screen.getByTestId("m1i2").id,
    );

    expect(screen.getByTestId("g2")).toHaveAttribute("aria-label", "G2");

    expect(screen.getByTestId("i3")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("i3")).toBeChecked();
    expect(screen.getByTestId("i3")).not.toHaveAttribute("data-active");
    expect(screen.getByTestId("i3")).toHaveAttribute(
      "data-entity",
      "show_bookmarks",
    );

    expect(screen.getByTestId("i4")).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByTestId("i4")).not.toBeChecked();
    expect(screen.getByTestId("i4")).not.toHaveAttribute("data-active");
    expect(screen.getByTestId("i4")).toHaveAttribute(
      "data-entity",
      "show_full_urls",
    );

    expect(screen.getByTestId("i6")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("i6")).not.toHaveAttribute("aria-expanded");
    expect(screen.getByTestId("i6")).not.toHaveAttribute("aria-haspopup");
    expect(screen.getByTestId("i6")).not.toHaveAttribute("data-active");
    expect(screen.getByTestId("i6")).toHaveAttribute(
      "data-entity",
      screen.getByTestId("i6").id,
    );

    expect(screen.getByTestId("i8")).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByTestId("i8")).toBeChecked();
    expect(screen.getByTestId("i8")).not.toHaveAttribute("data-active");
    expect(screen.getByTestId("i8")).toHaveAttribute("data-entity", "pedro");

    expect(screen.getByTestId("i9")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("i9")).not.toBeChecked();
    expect(screen.getByTestId("i9")).not.toHaveAttribute("data-active");
    expect(screen.getByTestId("i9")).toHaveAttribute("data-entity", "colm");
  });

  it("should properly move the active element by keyboard", async () => {
    const handleOnClose = jest.fn<void, []>();

    render(
      <>
        <button
          id="anchor"
          data-testid="anchor"
        >
          anchor
        </button>
        <Menu.Root
          label={{ screenReaderLabel: "Menu" }}
          open={true}
          onClose={handleOnClose}
          data-testid="root"
          resolveAnchor={() => document.getElementById("anchor")}
        >
          <Menu.Group
            label={{ screenReaderLabel: "G1" }}
            data-testid="g1"
          >
            <Menu.Item
              data-testid="i1"
              subMenu={
                <Menu.SubMenu data-testid="m1">
                  <Menu.Item data-testid="m1i1">New Tab</Menu.Item>
                  <Menu.Item data-testid="m1i2">New Window</Menu.Item>
                </Menu.SubMenu>
              }
            >
              {({ expanded }) => <>More Tools {expanded ? "-" : "+"}</>}
            </Menu.Item>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i2" />
          <Menu.Group
            data-testid="g2"
            label={{ screenReaderLabel: "G2" }}
          >
            <Menu.CheckItem
              value="show_bookmarks"
              data-testid="i3"
              disabled
              checked={true}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Bookmarks</>}
            </Menu.CheckItem>
            <Menu.CheckItem
              value="show_full_urls"
              data-testid="i4"
              checked={false}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Full URLs</>}
            </Menu.CheckItem>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i5" />
          <Menu.Item
            data-testid="i6"
            disabled
          >
            New Window
          </Menu.Item>
          <Menu.SeparatorItem data-testid="i7" />
          <Menu.RadioGroup
            label={{ screenReaderLabel: "People" }}
            data-testid="g3"
            value="pedro"
          >
            <Menu.RadioItem
              data-testid="i8"
              value="pedro"
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Pedro</>}
            </Menu.RadioItem>
            <Menu.RadioItem
              data-testid="i9"
              value="colm"
              disabled
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Colm</>}
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Root>
      </>,
    );

    expect(screen.getByTestId("root")).toHaveFocus();

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[Escape]");

    expect(handleOnClose.mock.calls.length).toBe(1);

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("i8")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[ArrowRight]");

    expect(screen.getByTestId("m1")).toBeInTheDocument();
    expect(screen.getByTestId("m1i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowLeft]");

    expect(screen.queryByTestId("m1")).not.toBeInTheDocument();
    expect(screen.getByTestId("i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[Space]");

    expect(screen.getByTestId("m1")).toBeInTheDocument();
    expect(screen.getByTestId("m1i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowLeft]");

    expect(screen.queryByTestId("m1")).not.toBeInTheDocument();
    expect(screen.getByTestId("i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[Enter]");

    expect(screen.getByTestId("m1")).toBeInTheDocument();
    expect(screen.getByTestId("m1i1")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowUp]");

    expect(screen.getByTestId("m1i2")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("m1i2")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowLeft]");
    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("i4")).toHaveAttribute("data-active");

    await userEvent.keyboard("[ArrowDown]");

    expect(screen.getByTestId("i8")).toHaveAttribute("data-active");
  });

  it("should properly select the active element by keyboard", async () => {
    const handleOnClose = jest.fn<void, []>();
    const handleCheckChange = jest.fn<void, [boolean]>();
    const handleValueChange = jest.fn<void, [string]>();

    render(
      <>
        <button
          id="anchor"
          data-testid="anchor"
        >
          anchor
        </button>
        <Menu.Root
          label={{ screenReaderLabel: "Menu" }}
          open={true}
          onClose={handleOnClose}
          data-testid="root"
          resolveAnchor={() => document.getElementById("anchor")}
        >
          <Menu.Group
            label={{ screenReaderLabel: "G1" }}
            data-testid="g1"
          >
            <Menu.Item
              data-testid="i1"
              subMenu={
                <Menu.SubMenu data-testid="m1">
                  <Menu.Item data-testid="m1i1">New Tab</Menu.Item>
                  <Menu.Item data-testid="m1i2">New Window</Menu.Item>
                </Menu.SubMenu>
              }
            >
              {({ expanded }) => <>More Tools {expanded ? "-" : "+"}</>}
            </Menu.Item>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i2" />
          <Menu.Group
            data-testid="g2"
            label={{ screenReaderLabel: "G2" }}
          >
            <Menu.CheckItem
              value="show_bookmarks"
              data-testid="i3"
              disabled
              checked={true}
              onCheckedChange={handleCheckChange}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Bookmarks</>}
            </Menu.CheckItem>
            <Menu.CheckItem
              value="show_full_urls"
              data-testid="i4"
              checked={false}
              onCheckedChange={handleCheckChange}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Full URLs</>}
            </Menu.CheckItem>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i5" />
          <Menu.Item
            data-testid="i6"
            disabled
          >
            New Window
          </Menu.Item>
          <Menu.SeparatorItem data-testid="i7" />
          <Menu.RadioGroup
            label={{ screenReaderLabel: "People" }}
            data-testid="g3"
            value="pedro"
            onValueChange={handleValueChange}
          >
            <Menu.RadioItem
              data-testid="i8"
              value="pedro"
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Pedro</>}
            </Menu.RadioItem>
            <Menu.RadioItem
              data-testid="i9"
              value="colm"
              disabled
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Colm</>}
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Root>
      </>,
    );

    expect(screen.getByTestId("root")).toHaveFocus();

    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[Space]");

    expect(handleOnClose.mock.calls.length).toBe(1);

    await userEvent.keyboard("[ArrowLeft]");
    await userEvent.keyboard("[ArrowLeft]");
    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[Space]");

    expect(handleCheckChange.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls[0]?.[0]).toBe(true);
    expect(handleOnClose.mock.calls.length).toBe(2);

    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[Space]");

    expect(handleCheckChange.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls[0]?.[0]).toBe(true);
    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toBe("pedro");
    expect(handleOnClose.mock.calls.length).toBe(3);
  });

  it("should be correctly interactive with mouse", async () => {
    const handleOnClose = jest.fn<void, []>();
    const handleCheckChange = jest.fn<void, [boolean]>();
    const handleValueChange = jest.fn<void, [string]>();

    render(
      <>
        <button
          id="anchor"
          data-testid="anchor"
        >
          anchor
        </button>
        <Menu.Root
          label={{ screenReaderLabel: "Menu" }}
          open={true}
          onClose={handleOnClose}
          data-testid="root"
          resolveAnchor={() => document.getElementById("anchor")}
        >
          <Menu.Group
            label={{ screenReaderLabel: "G1" }}
            data-testid="g1"
          >
            <Menu.Item
              data-testid="i1"
              subMenu={
                <Menu.SubMenu data-testid="m1">
                  <Menu.Item
                    data-testid="m1i1"
                    subMenu={
                      <Menu.SubMenu data-testid="m2">
                        <Menu.Item data-testid="m2i1">New Tab</Menu.Item>
                        <Menu.Item data-testid="m2i2">New Window</Menu.Item>
                      </Menu.SubMenu>
                    }
                  >
                    New Tab
                  </Menu.Item>
                  <Menu.Item data-testid="m1i2">New Window</Menu.Item>
                </Menu.SubMenu>
              }
            >
              {({ expanded }) => <>More Tools {expanded ? "-" : "+"}</>}
            </Menu.Item>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i2" />
          <Menu.Group
            data-testid="g2"
            label={{ screenReaderLabel: "G2" }}
          >
            <Menu.CheckItem
              value="show_bookmarks"
              data-testid="i3"
              disabled
              checked={true}
              onCheckedChange={handleCheckChange}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Bookmarks</>}
            </Menu.CheckItem>
            <Menu.CheckItem
              value="show_full_urls"
              data-testid="i4"
              checked={false}
              onCheckedChange={handleCheckChange}
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Show Full URLs</>}
            </Menu.CheckItem>
          </Menu.Group>
          <Menu.SeparatorItem data-testid="i5" />
          <Menu.Item
            data-testid="i6"
            disabled
          >
            New Window
          </Menu.Item>
          <Menu.SeparatorItem data-testid="i7" />
          <Menu.RadioGroup
            label={{ screenReaderLabel: "People" }}
            data-testid="g3"
            value="pedro"
            onValueChange={handleValueChange}
          >
            <Menu.RadioItem
              data-testid="i8"
              value="pedro"
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Pedro</>}
            </Menu.RadioItem>
            <Menu.RadioItem
              data-testid="i9"
              value="colm"
              disabled
            >
              {({ checked }) => <>{checked ? "⚫️" : "⚪️"} Colm</>}
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Root>
      </>,
    );

    expect(screen.getByTestId("root")).toHaveFocus();

    await userEvent.hover(screen.getByTestId("i1"));

    expect(screen.getByTestId("i1")).toHaveAttribute("data-active");
    expect(screen.getByTestId("m1")).toBeInTheDocument();

    await userEvent.hover(screen.getByTestId("m1i1"));

    expect(screen.getByTestId("m1i1")).toHaveAttribute("data-active");
    expect(screen.getByTestId("m2")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("m2i1"));

    expect(handleOnClose.mock.calls.length).toBe(1);

    await userEvent.unhover(screen.getByTestId("i1"));
    await userEvent.hover(screen.getByTestId("i3"));

    expect(screen.queryByTestId("m1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("m2")).not.toBeInTheDocument();
    expect(screen.getByTestId("i3")).not.toHaveAttribute("data-active");

    await userEvent.click(screen.getByTestId("i3"));

    expect(handleOnClose.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls.length).toBe(0);

    await userEvent.hover(screen.getByTestId("i4"));

    expect(screen.getByTestId("i4")).toHaveAttribute("data-active");

    await userEvent.click(screen.getByTestId("i4"));

    expect(handleOnClose.mock.calls.length).toBe(2);
    expect(handleCheckChange.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls[0]?.[0]).toBe(true);

    await userEvent.hover(screen.getByTestId("i6"));

    expect(screen.getByTestId("i6")).not.toHaveAttribute("data-active");

    await userEvent.click(screen.getByTestId("i6"));

    expect(handleOnClose.mock.calls.length).toBe(2);

    await userEvent.click(screen.getByTestId("i8"));

    expect(handleOnClose.mock.calls.length).toBe(3);
    expect(handleCheckChange.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls[0]?.[0]).toBe(true);
    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toBe("pedro");

    await userEvent.click(screen.getByTestId("i9"));

    expect(handleOnClose.mock.calls.length).toBe(3);
    expect(handleCheckChange.mock.calls.length).toBe(1);
    expect(handleCheckChange.mock.calls[0]?.[0]).toBe(true);
    expect(handleValueChange.mock.calls.length).toBe(1);
    expect(handleValueChange.mock.calls[0]?.[0]).toBe("pedro");

    await userEvent.hover(screen.getByTestId("i1"));
    await userEvent.keyboard("[ArrowDown]");

    expect(screen.queryByTestId("m1")).not.toBeInTheDocument();
    expect(screen.getByTestId("i4")).toHaveAttribute("data-active");
  });
});

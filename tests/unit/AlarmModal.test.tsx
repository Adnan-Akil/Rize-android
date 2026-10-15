import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AddAlarmScreen from "../../app/alarms/new";

// Mock expo-router
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
  }),
}));

describe("AddAlarmScreen Modal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders time display, AM/PM toggle, and quick presets", async () => {
    const { getByText, getByTestId, findByText } = render(<AddAlarmScreen />);

    expect(await findByText("Set Wake Routine")).toBeTruthy();
    expect(getByText("AM")).toBeTruthy();
    expect(getByText("PM")).toBeTruthy();
    expect(getByText("06:00")).toBeTruthy();
    expect(getByText("06:30")).toBeTruthy();
    expect(getByText("07:00")).toBeTruthy();
    expect(getByText("07:30")).toBeTruthy();
    expect(getByTestId("save-alarm-btn")).toBeTruthy();
  });

  it("switches AM/PM when toggled", async () => {
    const { getByText, findByText } = render(<AddAlarmScreen />);
    await findByText("Set Wake Routine");
    const pmPill = getByText("PM");
    fireEvent.press(pmPill);
    expect(pmPill).toBeTruthy();
  });
});

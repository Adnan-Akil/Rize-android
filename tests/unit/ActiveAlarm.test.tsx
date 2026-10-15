import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ActiveAlarmScreen from "../../app/active-alarm";

// Mock expo-router
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

describe("ActiveAlarmScreen (Dawn Waking Horizon)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders waking instructions, snooze button, and test disarm action", async () => {
    const { getAllByText, getByTestId } = await render(<ActiveAlarmScreen />);

    expect(getAllByText(/DISARM/i).length).toBeGreaterThan(0);
    expect(getByTestId("emergency-snooze-btn")).toBeTruthy();
    expect(getByTestId("simulate-disarm-btn")).toBeTruthy();
  });

  it("triggers emergency snooze and navigates back", async () => {
    const { getByTestId } = await render(<ActiveAlarmScreen />);
    const snoozeBtn = getByTestId("emergency-snooze-btn");
    fireEvent.press(snoozeBtn);
    expect(mockBack).toHaveBeenCalled();
  });
});

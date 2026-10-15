import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { DashboardHero } from "../../src/components/DashboardHero";
import { BottomNavBar } from "../../src/components/BottomNavBar";
import { Alarm } from "../../src/db/schema";

describe("Dashboard Components", () => {
  describe("DashboardHero", () => {
    it("renders active alarm countdown and status badge", () => {
      const activeAlarm: Alarm = {
        id: "alarm_1",
        time: "06:30",
        label: "Morning Focus",
        repeatDays: [1, 2, 3, 4, 5],
        isEnabled: true,
        tagId: "tag_mirror",
        ringtoneUri: null,
        vibrate: true,
        createdAt: Date.now(),
      };

      const { getByText } = render(
        <DashboardHero
          nextAlarm={activeAlarm}
          countdownText="In 6h 45m"
          tagName="Bathroom Mirror"
        />
      );

      expect(getByText("ACTIVE & READY")).toBeTruthy();
      expect(getByText("In 6h 45m")).toBeTruthy();
      expect(getByText(/Next: 06:30 AM/)).toBeTruthy();
    });

    it("renders peaceful empty state when no alarms are enabled", () => {
      const { getByText } = render(
        <DashboardHero
          nextAlarm={null}
          countdownText="No active alarms"
          tagName={null}
        />
      );

      expect(getByText("ALL QUIET")).toBeTruthy();
      expect(getByText("No active alarms")).toBeTruthy();
    });
  });

  describe("BottomNavBar", () => {
    it("renders navigation tabs and triggers onAddAlarm callback", () => {
      const onAddMock = jest.fn();
      const onTabMock = jest.fn();

      const { getByText, getByTestId } = render(
        <BottomNavBar
          activeTab="alarms"
          onSelectTab={onTabMock}
          onAddAlarm={onAddMock}
        />
      );

      expect(getByText("Alarms")).toBeTruthy();
      expect(getByText("NFC Tags")).toBeTruthy();

      const addBtn = getByTestId("bottom-nav-add-btn");
      fireEvent.press(addBtn);
      expect(onAddMock).toHaveBeenCalledTimes(1);
    });
  });
});

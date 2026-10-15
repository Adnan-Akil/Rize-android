import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SwipeableAlarmCard } from "../../src/components/SwipeableAlarmCard";
import { Alarm } from "../../src/db/schema";

describe("SwipeableAlarmCard", () => {
  const sampleAlarm: Alarm = {
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

  it("renders formatted time and alarm label", () => {
    const { getByText } = render(
      <SwipeableAlarmCard
        alarm={sampleAlarm}
        tagName="Bathroom Mirror"
        onToggle={jest.fn()}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    expect(getByText("06:30")).toBeTruthy();
    expect(getByText("AM")).toBeTruthy();
    expect(getByText("Morning Focus")).toBeTruthy();
    expect(getByText("Bathroom Mirror")).toBeTruthy();
  });

  it("triggers onToggle callback when switch is flipped", () => {
    const onToggleMock = jest.fn();
    const { getByTestId } = render(
      <SwipeableAlarmCard
        alarm={sampleAlarm}
        tagName="Bathroom Mirror"
        onToggle={onToggleMock}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
      />
    );

    const switchComponent = getByTestId("alarm-toggle-alarm_1");
    fireEvent(switchComponent, "valueChange", false);
    expect(onToggleMock).toHaveBeenCalledWith("alarm_1", false);
  });
});

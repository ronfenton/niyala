import { describe, expect, it } from '@jest/globals';
import { UpdateRegistry } from './eventSystem';
import * as enums from './enums';

describe('When UpdateRegistry is called', () => {
  it('with an empty existing registry, and no listeners, returns an empty array', () => {
    expect(UpdateRegistry([], [], 'ExampleFunction', 'someobject', enums.CharacteristicType.TESTING)).toHaveLength(0);
  });
  it('with an empty existing registry, and new listeners, returns an expanded array', () => {
    expect(UpdateRegistry([], [
      {
        eventName: 'SomeEvent',
      },
      {
        eventName: 'SomeOtherEvent',
      },
      {
        eventName: 'SomeThirdEvent',
      },
    ], 'ExampleFunction', 'someobject', enums.CharacteristicType.TESTING)).toHaveLength(3);
  });
  it('with an an registry, and new listeners, returns an array only with the appropriate items.', () => {
    expect(UpdateRegistry([
      {
        eventName: 'SomeEvent',
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
      {
        eventName: 'SomeOtherEvent',
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
      {
        eventName: 'SomeThirdEvent',
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
    ], [
      {
        eventName: 'SomeEvent',
      },
    ], 'ExampleFunction', 'someobject', enums.CharacteristicType.TESTING)).toHaveLength(1);
  });
  it('with an an expanded registry, and new listeners, returns an array only with the appropriate items, and only removes items that are appropriate', () => {
    expect(UpdateRegistry([
      {
        eventName: 'SomeEvent', // this event should remain - it is provided in the input.
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
      {
        eventName: 'SomeOtherEvent', // this event should vanish - it is the same func and listener, but not included in the input.
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
      {
        eventName: 'SomeThirdEvent', // This event should remain - it relates to another function call.
        listeningCharKey: 'someobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'AnotherFunction',
      },
      {
        eventName: 'UnrelatedEvent', // this event should remain, it's for an unrelated object.
        listeningCharKey: 'unrelatedobject',
        listeningCharType: enums.CharacteristicType.TESTING,
        funcID: 'ExampleFunction',
      },
    ], [
      {
        eventName: 'SomeEvent',
      },
    ], 'ExampleFunction', 'someobject', enums.CharacteristicType.TESTING)).toHaveLength(3);
  });
});

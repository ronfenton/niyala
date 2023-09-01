import { UpdateRegistry } from "./eventSystem";
import { describe, expect, test } from "@jest/globals"

describe('When UpdateRegistry is called', () => {
  test('With an empty existing registry, and no listeners, returns an empty array', () => {
    expect(UpdateRegistry([],[],'ExampleFunction','someobject').length).toStrictEqual(0)
  })
  test('With an empty existing registry, and new listeners, returns an expanded array', () => {
    expect(UpdateRegistry([],[
      {
        eventName:'SomeEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeOtherEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeThirdEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
    ],'ExampleFunction','someobject').length).toStrictEqual(3)
  })
  test('With an an registry, and new listeners, returns an array only with the appropriate items.', () => {
    expect(UpdateRegistry([
      {
        eventName:'SomeEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeOtherEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeThirdEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
    ],[
      {
        eventName:'SomeEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
    ],'ExampleFunction','someobject').length).toStrictEqual(1)
  })
  test('With an an expanded registry, and new listeners, returns an array only with the appropriate items, and only removes items that are appropriate', () => {
    expect(UpdateRegistry([
      {
        eventName:'SomeEvent', // this event should remain - it is provided in the input.
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeOtherEvent', // this event should vanish - it is the same func and listener, but not included in the input.
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
      {
        eventName:'SomeThirdEvent', // This event should remain - it relates to another function call.
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'AnotherFunction'
      },
      {
        eventName:'UnrelatedEvent', // this event should remain, it's for an unrelated object.
        listenerPath:'unrelatedobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
    ],[
      {
        eventName:'SomeEvent',
        listenerPath:'someobject',
        listenerType:'example',
        funcID:'ExampleFunction'
      },
    ],'ExampleFunction','someobject').length).toStrictEqual(3)
  })
})

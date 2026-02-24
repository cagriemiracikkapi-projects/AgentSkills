# Test-Driven Development (TDD) & Mocking Strategies

## Overview
This reference guide establishes the rules for writing deterministic unit tests that actually prevent bugs, rather than just checking arbitrary boxes for "code coverage" metrics.

## 1. The Red-Green-Refactor Cycle

TDD is a design process, not just a testing process. By writing the test first, you force yourself to design the class API exactly how a consumer would want to use it.

1. **RED:** Write a test for the next bit of functionality you want to add. Watch it fail.
2. **GREEN:** Write the absolute bare minimum amount of production code to make the test pass. (If it means hardcoding a `return true;`, do it).
3. **REFACTOR:** Now that the safety net is green, clean up the messy code, extract variables, and apply Design Patterns.

## 2. The AAA Pattern (Arrange, Act, Assert)

Every properly structured test has three distinct phases, usually separated by a blank line.

```javascript
test('processes refund successfully when account has sufficient balance', async () => {
    // 1. ARRANGE: Set the stage. Create the mock DB, the fake user, the service.
    const mockRepo = new MockTransactionRepository({ balance: 500 });
    const service = new RefundService(mockRepo);
    
    // 2. ACT: Execute the single method under test.
    const result = await service.processRefund(user.id, 100);
    
    // 3. ASSERT: Verify the state changed correctly or the correct output was returned.
    expect(result.status).toBe('APPROVED');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ amount: -100 }));
});
```

## 3. Mocking, Stubbing, and Spying

Do not confuse these three terms.

- **Stub:** A dummy object that provides canned answers to calls made during the test. (e.g., An interface `IGetCurrentWeather` that is hardcoded to return `72` degrees so your app logic can be tested predictably).
- **Spy:** A wrapper around a real function that records how many times it was called and with what arguments, but still lets the real code execute.
- **Mock:** A specialized object that *expects* to be called in a certain way. If the expected call doesn't happen, the mock fails the test automatically.

### Rule: Do Not Mock What You Do Not Own
Do not mock the `fetch()` API directly. Do not mock `axios`.
If you write a test that perfectly mocks the `axios` API, and then Stripe changes their JSON response format, your test will still Pass (because you mocked the old format), but your production code will Crash.

**The Fix:** Wrap 3rd party APIs in an interface `IStripeClient`. Mock your own interface. Then write 1 slow, live Integration Test against the real Stripe API.

## 4. Freezing Time

If your application checks `new Date()` or `DateTime.Now`, your tests will randomly fail if run exactly at midnight, or on Leap Years.

### Rule: Never rely on the system clock in tests.
Use your testing framework's Fake Timer capabilities (e.g., `jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))`).
Alternatively, pass `clock` or `timeProvider` as an injected dependency into your classes, so you can pass a `StaticTimeProvider` into the constructor during the *Arrange* phase.

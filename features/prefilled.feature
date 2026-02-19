Feature: Pre-filled URL State

  Scenario: Radio buttons are checked when opening a pre-filled URL
    Given I open the assessment with the following parameters:
      | deployability_1 | 1 |
    Then the radio button for "deployability_1" with value "1" should be checked

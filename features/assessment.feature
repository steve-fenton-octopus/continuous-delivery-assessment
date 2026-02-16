Feature: Continuous Delivery Assessment

  Scenario: The assessment application loads
    Given I open the assessment application
    Then I should see the assessment title "Continuous Delivery assessment"

  Scenario: Complete assessment with mixed scores
    Given I open the assessment application
    When I select value "2" for question "deployability_1"
    And I select value "2" for question "deployability_2"
    And I select value "2" for question "deployability_3"
    And I select value "3" for question "deployability_4"
    And I select value "1" for question "deployability_5"
    And I select value "3" for question "deployability_6"
    And I select value "2" for question "deployability_7"
    And I click the next button
    And I select value "3" for question "feedback_1"
    And I select value "3" for question "feedback_2"
    And I select value "3" for question "feedback_3"
    And I click the next button
    And I select value "1" for question "automation_1"
    And I select value "2" for question "automation_2"
    And I select value "3" for question "automation_3"
    And I select value "3" for question "automation_4"
    And I select value "3" for question "automation_5"
    And I select value "3" for question "automation_6"
    And I click the next button
    And I select value "1" for question "agility_1"
    And I select value "2" for question "agility_2"
    And I select value "2" for question "agility_3"
    And I select value "3" for question "agility_4"
    And I select value "3" for question "agility_5"
    And I select value "3" for question "agility_6"
    And I select value "3" for question "agility_7"
    And I submit the assessment
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see advice for "Deployability"
    And I should see advice for "Agility"
    And I should see advice for "Automation"

  Scenario: Complete assessment with maximum scores
    Given I open the assessment application
    When I select value "3" for question "deployability_1"
    And I select value "3" for question "deployability_2"
    And I select value "3" for question "deployability_3"
    And I select value "3" for question "deployability_4"
    And I select value "3" for question "deployability_5"
    And I select value "3" for question "deployability_6"
    And I select value "3" for question "deployability_7"
    And I click the next button
    And I select value "3" for question "feedback_1"
    And I select value "3" for question "feedback_2"
    And I select value "3" for question "feedback_3"
    And I click the next button
    And I select value "3" for question "automation_1"
    And I select value "3" for question "automation_2"
    And I select value "3" for question "automation_3"
    And I select value "3" for question "automation_4"
    And I select value "3" for question "automation_5"
    And I select value "3" for question "automation_6"
    And I click the next button
    And I select value "3" for question "agility_1"
    And I select value "3" for question "agility_2"
    And I select value "3" for question "agility_3"
    And I select value "3" for question "agility_4"
    And I select value "3" for question "agility_5"
    And I select value "3" for question "agility_6"
    And I select value "3" for question "agility_7"
    And I submit the assessment
    Then I should see the assessment title "Assessment results"
    And I should see the congratulations message

Feature: Continuous Delivery Assessment

  Scenario: The assessment application loads
    Given I open the assessment application
    Then I should see the assessment title "Continuous Delivery assessment"

  Scenario: All categories need improvement
    Given I open the assessment application
    When I submit a mixed score for "Deployability"
    And I submit a mixed score for "Feedback"
    And I submit a mixed score for "Automation"
    And I submit a mixed score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see advice for "Deployability"
    And I should see advice for "Agility"
    And I should see advice for "Automation"
    And I should see advice for "Feedback"

  Scenario: Deployability and agility need improvement
    Given I open the assessment application
    When I submit a mixed score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit the best score for "Automation"
    And I submit a mixed score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see advice for "Deployability"
    And I should see advice for "Agility"
    And I should not see advice for "Automation"
    And I should not see advice for "Feedback"

  Scenario: Only automation needs improvement
    Given I open the assessment application
    When I submit the best score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit a mixed score for "Automation"
    And I submit the best score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see advice for "Automation"
    And I should not see advice for "Agility"
    And I should not see advice for "Deployability"
    And I should not see advice for "Feedback"

  Scenario: Complete assessment with maximum scores
    Given I open the assessment application
    When I submit the best score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit the best score for "Automation"
    And I submit the best score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the congratulations message
    And I should see advice for "Automation"
    And I should not see advice for "Agility"
    And I should not see advice for "Deployability"
    And I should not see advice for "Feedback"

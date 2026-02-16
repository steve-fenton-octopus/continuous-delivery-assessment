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
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | Yes    |
      | Automation    | Yes    |
      | Deployability | Yes    |
      | Feedback      | Yes    |

  Scenario: Deployability and agility need improvement
    Given I open the assessment application
    When I submit a mixed score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit the best score for "Automation"
    And I submit a mixed score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | Yes    |
      | Automation    | No     |
      | Deployability | Yes    |
      | Feedback      | No     |

  Scenario: Only automation needs improvement
    Given I open the assessment application
    When I submit the best score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit a mixed score for "Automation"
    And I submit the best score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the results page with the spider chart
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | No     |
      | Automation    | Yes    |
      | Deployability | No     |
      | Feedback      | No     |

  Scenario: Complete assessment with maximum scores
    Given I open the assessment application
    When I submit the best score for "Deployability"
    And I submit the best score for "Feedback"
    And I submit the best score for "Automation"
    And I submit the best score for "Agility"
    Then I should see the assessment title "Assessment results"
    And I should see the congratulations message
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | No     |
      | Automation    | No     |
      | Deployability | No     |
      | Feedback      | No     |

Feature: Continuous Delivery Assessment

  Scenario: The assessment application loads
    Given I open the assessment application
    Then I should see the page title "Continuous Delivery assessment"

  Scenario: All categories need improvement
    Given I open the assessment application
    When "Deployability" has a mixed score for questions
    And "Feedback" has a mixed score for questions
    And "Automation" has a mixed score for questions
    And "Agility" has a mixed score for questions
    And "Informational" has a mixed score for questions
    Then I should see the sub title "Assessment results"
    And I should see the results page with the spider chart
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | Yes    |
      | Automation    | Yes    |
      | Deployability | Yes    |
      | Feedback      | Yes    |

  Scenario: Deployability and agility need improvement
    Given I open the assessment application
    When "Deployability" has a mixed score for questions
    And "Feedback" has the best score for questions
    And "Automation" has the best score for questions
    And "Agility" has a mixed score for questions
    And "Informational" has a mixed score for questions
    Then I should see the sub title "Assessment results"
    And I should see the results page with the spider chart
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | Yes    |
      | Automation    | No     |
      | Deployability | Yes    |
      | Feedback      | No     |

  Scenario: Only automation needs improvement
    Given I open the assessment application
    When "Deployability" has the best score for questions
    And "Feedback" has the best score for questions
    And "Automation" has a mixed score for questions
    And "Agility" has the best score for questions
    And "Informational" has a mixed score for questions
    Then I should see the sub title "Assessment results"
    And I should see the results page with the spider chart
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | No     |
      | Automation    | Yes    |
      | Deployability | No     |
      | Feedback      | No     |

  Scenario: Complete assessment with maximum scores
    Given I open the assessment application
    When "Deployability" has the best score for questions
    And "Feedback" has the best score for questions
    And "Automation" has the best score for questions
    And "Agility" has the best score for questions
    And "Informational" has a mixed score for questions
    Then I should see the sub title "Assessment results"
    And I should see the congratulations message
    And I should see the following advice:
      | Category      | Advice |
      | Agility       | No     |
      | Automation    | No     |
      | Deployability | No     |
      | Feedback      | No     |

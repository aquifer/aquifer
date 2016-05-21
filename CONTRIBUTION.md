# Contributing to Aquifer
This document describes the workflow that Aquifer adheres to in regards to contributing code, submitting issues, and reviewing pull requests.

## GitHub Issues
Aquifer uses GitHub Issues to keep track of bugs, features, and tasks. If you would like to report a bug or request a feature, please create a GitHub issue and include the following information, depending on the type of issue.

### Reporting a bug
Create a GitHub issue with the "bug" label, and include the following information:

* A title, which should be a short description of the problem.
  * For example: "Build system fails to symlink files directory"
* A meaningful description.
  * Describe the problem adequately and precisely. 
  * Details such as operating system and version, Node.js version and Drush version should be defined.
  * Include a "Steps to reproduce" section that outlines how someone can reproduce the bug you're reporting.

Do NOT include the following:

* Sensitive information.
* Giant meaningless logs.
* Pointed or insulting comments.

Once you have created your bug issue, feel free to take a stab at solving the issue, or another issue in the queue. :) We <3 contributions, open source for the win!

### Requesting a feature
We are always looking for new ideas and awesome features to add! If you would like to see a feature in an upcoming Aquifer release, create a GitHub issue and label it "feature request". We'll take a look and discuss the request in the issue comments.

Keep in mind that Aquifer has an extension system. Aquifer core is intended to contain only the mechanisms needed to create functional build system. Other features should be created as configurable extensions so that people can optionally use the feature. Examples of good use-cases for the extension system are [aquifer-coder](https://github.com/aquifer/aquifer-coder) and [aquifer-git](https://github.com/aquifer/aquifer-git).

## Contributing code
Contributions are welcome and wanted! Please consider the following guidelines when submitting code to Aquifer core.

### Code quality
Before attempting to merge change that you have made on a branch, it is imperative that your code meet the following requirements:

* Passes code linters and code standards sniffers. (`npm run lint`)
* Passes unit and functional tests. (upcoming)
* Introduces new unit and/or functional tests when appropriate.
* Includes properly formatted docblocks and helpful inline comments.
* Introduces new, or necessary changes to existing non-code documentation (such as wiki pages)

### Creating a pull request
When you have made changes to a project on a branch and would like to merge those changes into the main project, you need to follow a couple steps:

* Create a PR that proposes merging your branch into the main branch.
* In the PR description, describe what the changes in your PR do, and the value it provides.
* In the PR description, create a section called “Steps to test”. This section should hold a bulleted list of instructions that anyone would need to follow to fully verify that your code is working correctly.
* Tag the PR accordingly. If it is a bug, or a feature, or a feature enhancement, tag it as such.
* When is reviewing your PR, they are responsible for making any comments on functional or code-related problems. Go through and address the concerns that have been outlined.
* When all comments by the reviewer have been addressed, the reviewer is to re-review the PR.
* This process is iteratively followed, until the reviewer gives a thumbs up, and adds the “Passes functional review” and “Passes code review” tags to the PR.
* When a PR has passed code and functional review, it can then be merged into the project.

When you make changes to a project, you will make mistakes, and when you propose changes to a project people will point those mistakes out. Don’t feel offended or upset when reviewers leave comments on your PRs; the process is in place to ensure good code quality, not to call you out or make you feel bad about your code.

## Reviewing PRs
A great way to contribute to a project is to review pull requests that are in the queue. When reviewing a PR, you must perform two types of review; functional, and code. Once a PR has passed both review types, and passes automated testing, it is ready to merge.

### Code review
Reviewing the code within a PR is intended to go beyond linting, code standards sniffing, and unit testing in the quest to ensure good code quality. When reviewing the code within a PR, go through the diff keep the following things in mind:

* Changes made should be sensical, and relative to the PR description.
* Code should maintain a good balance between concision and readability.
* Docblocks and inline comments should be formatted correctly and be readable, understandable, and contextually helpful.
* Code should be intuitive. If you know of a better way to accomplish something, speak up.
* Generally speaking, code should be DRY.

When you review a PR, if you see anything that doesn’t make sense or doesn’t fit the standard, leave a comment describing the problem, and be sure to provide references to other documentation if needed. 

Remember to phrase your comments so that they are not abrasive; the intention of the process is to ensure good code quality, not call people out or belittle them. When writing comments, put yourself in the shoes of the person whose PR you are reviewing, and describe the problem in a way that is helpful and understandable to them.

This process is iterative, so it may take a couple rounds of review and response to get to an acceptable PR, but once the PR passes code review, be sure to add the “Passes code review” tag to the PR.

### Functional review
The purpose of functional review is to ensure that changes made to the codebase introduce only expected functional changes to the project. When reviewing a PR functionally, go through the “Steps to test” portion of the PR description, and perform each step. If the PR does not include a “Steps to test” section, leave a comment asking for an explicit list of steps to test.
Once you have gone through the “Steps to test” and have been able to verify that the functional changes are ready to ship, add the “Passes functional review” tag to the PR.


export function SurveyController(surveyService) {

  return {
    * createSurvey(next) {
      this.status = 200;
      this.body = yield surveyService.createSurvey(this.request.body);
    },

    * getSurveys(next) {
      this.status = 200;
      this.body = yield surveyService.getSurveys();
    },

    * deleteSurvey(next) {
      this.status = 200;
      this.body = yield surveyService.deleteSurvey(this.params.id);
    },

    * updateSurvey(next) {
      this.status = 200;
      this.body = yield surveyService.updateSurvey(this.request.body);
    },

    * getSurvey(next) {
      this.status = 200;
      this.body = yield surveyService.getSurvey(this.params.id);
    },

    * getDashboardOverview(next) {
      this.status = 200;
      this.body = yield surveyService.getDashboardOverview(this.params.surveyId);
    },

    * getDashboardQuestion(next) {
      this.status = 200;
      this.body = yield surveyService.getDashboardQuestion(this.params.surveyId, this.params.questionId, null);
    },
   
    * getDashboardQuestionWithFilter(next) {
      this.status = 200;
      this.body = yield surveyService.getDashboardQuestion(this.params.surveyId, this.params.questionId, this.request.body);
    },

    * addAnswer(next) {
      //if(!this.session) {
      //  throw Error("Yo we aint got no session!");
      //}
      //if(!this.session.userId) {
      //  throw Error("We got a session but no userId!");
      //}
      this.status = 200;
      this.body = yield surveyService.addAnswer(this.session.userId, this.session.useragent, this.request.body);
    }

  };
}

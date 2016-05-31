import parseEnv from "parse-env";
import tpl from "./config.template";
import mount from "koa-mount";
import monk from "monk";
import router from "koa-router";
import {SurveyService} from "./services/survey";
import {SurveyController} from "./controllers/survey";

export default function(path, mongoURL) {
  process.env["VERBOSE_PARSE_ENV"] = 1;
  var config = parseEnv(process.env, {"survey": tpl})["survey"];

  var db = monk(config.mongoUrl);
  var surveyService = new SurveyService(db);
  var surveyController = SurveyController(surveyService);

  var r = new router();
  r.get("/surveys", surveyController.getSurveys);
  r.post("/survey", surveyController.createSurvey);
  r.post("/answer", surveyController.addAnswer);
  r.del("/survey/:id", surveyController.deleteSurvey);
  r.put("/survey", surveyController.updateSurvey);
  r.get("/dashboard/overview/:surveyId", surveyController.getDashboardOverview);
  r.get("/dashboard/:surveyId/:questionId", surveyController.getDashboardQuestion);
  r.post("/dashboard/:surveyId/:questionId", surveyController.getDashboardQuestionWithFilter);
  r.get("/survey/:id", surveyController.getSurvey);

  return mount(path, r.middleware());
}

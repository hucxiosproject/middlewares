import wrap from "co-monk";
import mongodb from "mongodb";
var ObjectID = mongodb.ObjectID;

export class SurveyService {

  constructor(db) {
    this._surveys = wrap(db.get("surveys"));
    this._answers = wrap(db.get("answers"));
    this._users = wrap(db.get("users"));
    this._answers.ensureIndex({"userId": 1});                                                                                                                                                                                              
    this._answers.ensureIndex({"questionId": 1});
    this._answers.ensureIndex({"questionBody": 1});
  }

  * createSurvey(survey) {
    return yield this._surveys.insert(survey);
  }

  * updateSurvey(survey) {
    var result = yield this._surveys.update({
      "_id": survey._id
    },
    survey
    );
    return result;
  }

  * getSurveys() {
    var surveys = yield this._surveys.find({});
    for (var idx in surveys) {
      surveys[idx].created = surveys[idx]._id.getTimestamp();
    }
    return surveys;
  }

  * getSurvey(id) {
    return yield this._surveys.findOne({"_id": id});
  }

  * deleteSurvey(id) {
    return yield this._surveys.remove({"_id": ObjectID(id)});
  }

  * addAnswer(userId, useragent, answer) {
    var user = yield this._users.findOne({"_id": userId});
    var query = {"userId": userId, "surveyId": ObjectID(answer.surveyId), "questionId": answer.questionId};
    var a = yield this._answers.findOne(query);
    if(a) {

      return a; 
    } 

    // Decorate with gender
    if (user.wechat.sex === 1) {
      answer.gender = "male";
    } 
    if(user.wechat.sex == 2) {
      answer.gender = "female";
    }  
    answer.surveyId = ObjectID(answer.surveyId);
    answer.userId = userId;
    answer.useragent = useragent;
    if(useragent.os.family) {
      answer.os = useragent.os.family;
    }
    if(useragent.device.brand) {
      answer.brand = useragent.device.brand;
    }
    return yield this._answers.insert(answer);
  }

  * _handleQuestion(question) {
    
  } 

  * getDashboardOverview(surveyId) {
    var overview = {
      gender: {
        columns: [] 
      },
      brands: {
        columns: []
      }
    };
    var survey = yield this._surveys.findOne({"_id": ObjectID(surveyId)});
    var query = {
      "surveyId": survey._id, 
      "gender": "male", 
    };
    overview.gender.columns.push(["MALE", (yield this._answers.distinct("userId", query)).length]);
    var query = {
      "surveyId": survey._id, 
      "gender": "female", 
    };
    overview.gender.columns.push(["FEMALE", (yield this._answers.distinct("userId", query)).length]);

    overview.distinctBrands = yield this._answers.distinct("brand", {"surveyId": survey._id}); 
    for(var bidx in overview.distinctBrands) {
      var query = {
        "surveyId": survey._id, 
        "brand": overview.distinctBrands[bidx], 
      };
      overview.brands.columns.push([overview.distinctBrands[bidx], (yield this._answers.distinct("userId", query)).length]); 
    }
    return overview;
  } 

  * getDashboardQuestion(surveyId, questionId, filter) {
    var survey = yield this._surveys.findOne({"_id": ObjectID(surveyId)});
    var question = false; 
    // Loop until we find the right question
    for(var qidx in survey.questions) {
      question = survey.questions[qidx];
      if(question._id == questionId) {
        break;
      } else {
        question = null;
      } 
    }
    if(!question) {
      throw Error("Could not find question with id: " + questionId);
    }
    // OK we got the question
    // so now we are gonna play with the choices
    var totalCount = 0;
    for(var cidx in question.choices) {
      var choice = question.choices[cidx];
      var query = {
        "surveyId": survey._id, 
        "questionBody": question.body, 
        "choices": {"$elemMatch": {"body": choice.body}}
      };
      if(filter) {
        query["$and"] = [];
        for(var filterGroup in filter) {
          var filterType = filter[filterGroup];
          if(filterType.length <= 0) continue;
          // Add all the ors to this and
          var ors = [];
          for(var key in filterType) {
            var or = {};
            or[filterGroup] = {
              "$eq": filterType[key] 
            }
            ors.push(or);
          }
          query["$and"].push({"$or": ors});
        }
      }
      var answers = yield this._answers.find(query); 
      choice.count = answers.length;
      totalCount += choice.count;;
    }
    // Calculate percentage
    for(var cidx in question.choices) {
      var choice = question.choices[cidx];
      choice.percent = Math.round(choice.count / totalCount * 100.0, 1);
    }
    return question;
  }

  //* getDashboard(surveyId, filter) {
  //  var survey = yield this._surveys.findOne({"_id": ObjectID(surveyId)});

  //  for(var qidx in survey.questions) {
  //    var question = survey.questions[qidx];
  //    for(var cidx in question.choices) {
  //      var choice = question.choices[cidx];
  //      var maleAnswers = yield this._answers.find(
  //      {
  //        "surveyId": survey._id, 
  //        "gender": {
  //          "$exists": true,
  //          "$eq": "m"
  //        },
  //        "questionBody": question.body, 
  //        "choices": {"$elemMatch": {"body": choice.body}}
  //      });
  //      var femaleAnswers = yield this._answers.find(
  //      {
  //        "surveyId": survey._id, 
  //        "gender": {
  //          "$exists": true,
  //          "$eq": "f"
  //        },
  //        "questionBody": question.body, 
  //        "choices": {"$elemMatch": {"body": choice.body}}
  //      });
  //      var unknownAnswers = yield this._answers.find(
  //      {
  //        "surveyId": survey._id, 
  //        "gender": {
  //          "$exists": false,
  //        },
  //        "questionBody": question.body, 
  //        "choices": {"$elemMatch": {"body": choice.body}}
  //      });
  //      choice.maleCount = maleAnswers.length;
  //      choice.femaleCount = femaleAnswers.length;
  //      choice.unknownCount = unknownAnswers.length;
  //      choice.count = choice.maleCount+choice.femaleCount+choice.unknownCount;

  //    }
  //  }
  //  return survey;
  //}

}

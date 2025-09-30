
export const PARSE_TIME_ON_TASK_PIPELINE = [
  {
    $unwind: {
      path: "$questions",
    },
  },
  {
    $addFields: {
      time_parts: {
        $cond: {
          if: {
            $eq: ["$questions.time_on_task", "-"],
          },
          then: null,
          else: {
            $split: ["$questions.time_on_task", ":"],
          },
        },
      },
    },
  },
  {
    $addFields: {
      minutes: {
        $cond: {
          if: {
            $eq: ["$time_parts", null],
          },
          then: 0,
          else: {
            $convert: {
              input: {
                $arrayElemAt: ["$time_parts", 0],
              },
              to: "int",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      seconds: {
        $cond: {
          if: {
            $eq: ["$time_parts", null],
          },
          then: 0,
          else: {
            $convert: {
              input: {
                $arrayElemAt: ["$time_parts", 1],
              },
              to: "int",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
    },
  },
  {
    $addFields: {
      total_seconds: {
        $add: [
          {
            $multiply: ["$minutes", 60],
          },
          "$seconds",
        ],
      },
    },
  },
  {
    $match: {
      total_seconds: {
        $type: "number",
      },
    },
  },
];
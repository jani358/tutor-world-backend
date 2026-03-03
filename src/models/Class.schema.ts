import mongoose, { Document, Schema } from "mongoose";

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  classId: string;
  name: string;
  description: string;
  teacher?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  status: "active" | "inactive";
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    classId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ teacher: 1, isDeleted: 1 });
classSchema.index({ status: 1, isDeleted: 1 });

export default mongoose.model<IClass>("Class", classSchema);

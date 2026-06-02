import mongoose from 'mongoose';

const { Schema } = mongoose;

// An option belongs to a parameter and carries the prompt fragment that gets
// injected into the final instruction when the option is selected.
const optionSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    prompt_fragment: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const parameterSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['single_select', 'multi_select'],
      default: 'single_select',
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    options: { type: [optionSchema], default: [] },
  },
  { timestamps: true }
);

parameterSchema.index({ order: 1 });

// Public projection: never exposes prompt_fragment (kept server-side only).
parameterSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    label: this.label,
    type: this.type,
    options: this.options
      .filter((o) => o.active)
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o._id.toString(), label: o.label })),
  };
};

// Admin projection: includes prompt_fragment and inactive entries.
parameterSchema.methods.toAdmin = function toAdmin() {
  return {
    id: this._id.toString(),
    label: this.label,
    type: this.type,
    order: this.order,
    active: this.active,
    options: this.options
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((o) => ({
        id: o._id.toString(),
        label: o.label,
        prompt_fragment: o.prompt_fragment,
        order: o.order,
        active: o.active,
      })),
  };
};

export const StagingParameter = mongoose.model(
  'StagingParameter',
  parameterSchema
);

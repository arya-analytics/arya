attribute float a_x;
attribute float a_y;
attribute vec2 a_translate;

uniform lowp vec2 u_region_scale;
uniform lowp vec2 u_region_offset;
uniform lowp vec2 u_scale;
uniform lowp vec2 u_offset;

void main(void) {
  vec2 transformed = u_region_scale * (u_scale * vec2(a_x,a_y) + u_offset) + u_region_offset;
  transformed = transformed + a_translate;
  gl_Position = vec4(transformed, 0.0, 1.0);
}

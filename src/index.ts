import type React from 'react'

export type LocaleMap = Record<string, string>

export type PluginScope =
  /** Access the camera feed (future). */
  | 'camera.read'
  /**
   * Mark this plugin as installable — it can be installed by users and loaded on app start.
   * Installable plugins may export a `PluginService` factory to run as a background service
   * and expose an API to other plugins via `context.service(providerId)`.
   */
  | 'install'
  /** Control torque, write homing offsets to motor EEPROM, and persist calibration data to the backend API. */
  | 'robot.calibration'
  /** Write low-level servo config (e.g. servo ID). Destructive — only one servo may be on the bus. */
  | 'robot.config'
  /** Send position commands and control speed. Implies robot.read. */
  | 'robot.control'
  /** Access a second robot connection in the 'leader' role for dual-arm setups. */
  | 'robot.leader'
  /**
   * Declare that this plugin requires physical presence — the operator must be able to
   * manually position the arm (e.g. calibration workflows). When this scope is present,
   * the WebRTC transport option is grayed out in the connect dialog with an explanation.
   */
  | 'robot.local'
  /** Read raw servo positions and registers. */
  | 'robot.read'
  /**
   * Require a saved robot profile ("My robots") rather than a generic model type.
   * Use when the plugin must persist data to a specific physical robot (e.g. calibration).
   * The generic "Models" option is hidden in the connect dialog when this scope is declared.
   */
  | 'robot.saved'
  /** Require the user to be signed in before the plugin loads. */
  | 'user.auth'
  /** Read basic user profile (name, email). */
  | 'user.profile'
  /** Read the user's robots and motion paths via listUserRobots(), listUserPaths(), and readPath(). */
  | 'user.read'

/**
 * Named connection slot. 'default' is always the primary (follower) arm.
 * 'leader' is available when the plugin declares the 'robot.leader' scope.
 */
export type ConnectionRole = 'default' | 'leader'

export interface PluginManifest {
  /** SDK major version this plugin targets. */
  sdkVersion: '1'
  /** Lowercase, URL-safe vendor identifier. */
  vendor: string
  /** Lowercase, URL-safe tool identifier, unique within the vendor namespace. */
  slug: string
  /** Display name — at least 'en' is required. */
  name: LocaleMap
  /** Short description shown in the marketplace listing — at least 'en' is required. */
  description: LocaleMap
  /** Lucide icon name or inline SVG string. */
  icon: string
  /** Capabilities the plugin requires. Empty means UI-only (no hardware access). */
  scopes: PluginScope[]
  /**
   * Service identifier this plugin registers when installed.
   * Other plugins reference this string in `dependencies` and call `context.service(provides)`.
   * Only meaningful when `scopes` includes `'install'` and the plugin exports `PluginService`.
   */
  provides?: string
  /**
   * Other plugins that must be installed and running before this plugin is initialised.
   * Each entry must match the `vendor`/`slug` of an installed plugin that exports a service.
   */
  dependencies?: Array<{ vendor: string; slug: string }>
}

// --- Calibration ---

export interface JointCalibration {
  rawMin: number
  rawMax: number
  urdfMin: number
  urdfMax: number
}

export interface CalibrationData {
  version: number
  motors: Record<number, JointCalibration>
}

export interface CameraCalibrationData {
  model: 'standard' | 'wide-angle'
  fx: number
  fy: number
  cx: number
  cy: number
  distCoeffs: number[]
  imageWidth: number
  imageHeight: number
  reprojectionError: number
  capturedAt: string
  cameraName?: string
  mirrorH?: boolean
  mirrorV?: boolean
}

// --- WorldView ---

export interface JointInfo {
  name: string
  label: string
  /** 'revolute' | 'prismatic' | 'continuous' at runtime. */
  type: string
  lower: number
  upper: number
}

/** Plain 3D vector. At runtime the host may return THREE.Vector3, which satisfies this structurally. */
export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface WorldViewApi {
  setJoint(name: string, value: number): void
  resetJoints(smooth?: boolean): void
  getJoints(): JointInfo[]
  setTargetPosition(pos: [number, number, number]): void
  setRobotOpacity(opacity: number): void
  setLinkHighlight(highlightLinkNames: string[], foreground: number, background: number): void
  getJointWorldPosition(name: string): Vector3 | null
  getJointWorldAxis(name: string): Vector3 | null
  getWorldPositionInLink(linkName: string, localX: number, localY: number, localZ: number): Vector3 | null
}

/**
 * WorldView props available to plugins. The host automatically injects the
 * robot configuration for the active connection — plugins do not pass robotConfig.
 */
export interface PluginWorldViewProps {
  cameraDistanceScale?: number
  ghostJoints?: Record<string, number>[]
  motionMode?: 'instant' | 'realistic'
  onLoad?: (joints: JointInfo[]) => void
  onLoadProgress?: (loaded: number, total: number) => void
  onTargetMove?: (pos: [number, number, number]) => void
  showTargetSphere?: boolean
  targetPosition?: [number, number, number]
  targetSphereRadius?: number
  trackLivePosition?: boolean
  /** Auto-solve IK when the target sphere is dragged. Requires a trained IK model on the robot config. */
  autoSolveIK?: boolean
  /** Show a semi-transparent camera frustum. WorldView auto-updates it from joint FK whenever joints change. */
  showCameraFrustum?: boolean
  /** Camera calibration data used to derive frustum FOV. When provided with showCameraFrustum, the frustum is shown with accurate field-of-view. */
  cameraCalibration?: CameraCalibrationData | null
}

// --- UI component props ---

export interface CameraViewHandle {
  video: HTMLVideoElement | null
  canvas: HTMLCanvasElement | null
  mirrorH: boolean
  mirrorV: boolean
  captureFrame(): ImageData | null
}

export interface CameraViewProps {
  stream?: MediaStream | null
  className?: string
  cursor?: string
  onMouseMove?: React.MouseEventHandler<HTMLDivElement>
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>
  onClick?: React.MouseEventHandler<HTMLDivElement>
  children?: React.ReactNode
  noCamera?: React.ReactNode
  canvasMode?: boolean
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  size?: 'default' | 'icon' | 'lg' | 'sm'
  variant?: 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

export type CardProps = React.HTMLAttributes<HTMLDivElement>

// --- Robot config subset exposed to plugins ---

export interface PluginRobotConfig {
  modelId: string
  /** Maps URDF joint name to motor servo ID. */
  jointServoId: Record<string, number>
  /** Maps motor servo ID to neutral (home) encoder position (0–4095). */
  servoNeutral: Record<number, number>
  /** Convert raw encoder value (0–4095) to URDF joint value (rad for revolute, m for prismatic). */
  encoderToJoint: (id: number, encoder: number) => number
  /** Convert URDF joint value (rad for revolute, m for prismatic) to raw encoder value (0–4095). */
  jointToEncoder: (id: number, value: number) => number
  /** Get the neutral URDF joint value for a servo. */
  neutralJointValue: (id: number) => number
  /** Force/load sensors attached to the robot bus. Empty when the model has none. */
  forceSensors: Array<{ id: number; label: string; max?: number }>
}

// --- Camera ---

export interface CameraHandle {
  id: string
  label: string
  source: 'local' | 'remote'
  stream: MediaStream
}

// --- Host services ---

export interface PluginUser {
  id: string
  email: string
  name: string
  role: number
}

export interface SceneObject {
  label: string
  box: { x_min: number; y_min: number; x_max: number; y_max: number }
}

export interface PluginRobotModel {
  id: string
  label: string
}

// --- Robot handle ---

/** All APIs scoped to a single robot connection. */
export interface RobotHandle {
  // --- Connection state ---

  connection: {
    connected: boolean
    robotId: string | null
    robotModel: string | null
    /** True when connected to the virtual (no-hardware) service. */
    virtual: boolean
    /** True when connected via WebRTC to a remote robot. */
    remote: boolean
  }

  /** Opens the standard connect-a-robot dialog for this role. */
  openConnectDialog: () => void

  // --- Servo API (methods are absent when the required scope is not declared) ---

  servo: {
    // robot.read ---------------------------------------------------------------

    /** Read the raw encoder position (0–4095) of a single servo. */
    readPosition: (id: number) => Promise<number>
    /** Read `len` bytes from register `addr` on a servo. */
    readRegisters: (id: number, addr: number, len: number) => Promise<number[]>
    /**
     * Read all joint positions in URDF units (rad for revolute, m for prismatic).
     * Values are ordered by servo ID ascending. Returns null when disconnected.
     * Motors that fail to respond are silently replaced with their neutral value.
     */
    readJointPositions: () => Promise<null | number[]>
    /**
     * Like readJointPositions, but exposes per-motor failure.
     * Each entry carries the joint name and its URDF value, or value: null when the motor
     * did not respond. Outer null means the robot is disconnected.
     * Values are ordered by servo ID ascending.
     */
    readJointPositionsStatus: () => Promise<Array<{ name: string; value: number | null }> | null>

    // robot.control ------------------------------------------------------------

    /** Move a single servo to a raw position (0–4095). Optional speed; 0 = maximum. */
    setPosition: (id: number, position: number, speed?: number) => Promise<void>
    /** Move multiple servos simultaneously via a single SYNC_WRITE broadcast. */
    syncSetPositions: (positions: Array<{ id: number; position: number }>) => Promise<void>
    /**
     * Command joint positions in URDF units (rad for revolute, m for prismatic).
     * Values must be ordered by servo ID ascending, matching readJointPositions output.
     * No-op when disconnected or emergency-stopped.
     */
    setJointPositions: (positions: number[]) => Promise<void>
    /** Broadcast a goal-speed limit to all servos; 0 = maximum speed. */
    limitSpeed: (speed: number) => Promise<void>
    /**
     * Register this plugin as an active user of the emergency stop button.
     * Call on mount; call the returned cleanup on unmount.
     */
    registerEmergencyStop: () => () => void

    // robot.calibration --------------------------------------------------------

    /**
     * Write `data` bytes to register `addr` on a servo.
     * For EEPROM registers (addr < 40) the plugin is responsible for unlocking
     * the Lock register (addr 55) before writing and re-locking it afterwards.
     */
    writeRegisters: (id: number, addr: number, data: number[]) => Promise<void>
    /** Enable or disable torque on a single servo. */
    setTorque: (id: number, enabled: boolean) => Promise<void>
    /** Broadcast torque-disable to all servos on the bus. */
    disableTorque: () => Promise<void>
    /**
     * Calibrate homing offsets: clears stale EEPROM offsets, reads true encoder
     * positions, then writes offset = neutral − raw. Torque must be disabled first.
     */
    calibrateNeutralPositions: (motors: Array<{ id: number; neutral: number }>) => Promise<void>

    // robot.config -------------------------------------------------------------

    /**
     * Change the servo ID stored in EEPROM via broadcast.
     * Only one servo must be connected on the bus when calling this.
     */
    setId: (newId: number) => Promise<void>
  }

  /**
   * Robot configuration for this connection.
   * Null when no robot is connected or the model is unknown.
   */
  robotConfig: PluginRobotConfig | null

  /**
   * Camera calibration saved for the connected robot, or null when none has been saved.
   * Requires the `robot.read` scope.
   */
  cameraCalibration: CameraCalibrationData | null

  /** Persist neutral-position calibration data for the connected robot. */
  saveCalibration: (data: CalibrationData) => Promise<void>

  /**
   * Persist full range-of-motion calibration (rawMin/rawMax per motor)
   * for the connected robot.
   */
  saveRangeCalibration: (motors: Record<number, JointCalibration>) => Promise<void>

  /**
   * Persist camera intrinsics to the connected robot's calibration record.
   * Merges with existing calibration — motor data is preserved.
   * Requires the `robot.calibration` scope.
   */
  saveCameraCalibration: (data: CameraCalibrationData) => Promise<void>

  /**
   * Show the standard safety-check dialog.
   * Resolves to true when the user confirms, false when cancelled.
   */
  showSafetyWarning: () => Promise<boolean>
}

// --- Kinematics ---

export interface FKResult {
  /** End-effector position in metres (URDF world frame). */
  position: [number, number, number]
  /** 3×3 rotation matrix (row-major). */
  rotation: [[number, number, number], [number, number, number], [number, number, number]]
}

export interface KinematicsApi {
  /**
   * Compute forward kinematics for the active robot.
   * `angles` maps URDF joint names to values (rad for revolute, m for prismatic).
   * Only joints present in the map are moved; others stay at 0.
   * `linkName` overrides the default end-effector link — pass any URDF link name
   * to get the world-frame pose of that specific link (e.g. `'camera_virtual'`).
   */
  forwardKinematics(angles: Record<string, number>, linkName?: string): Promise<FKResult>

  /**
   * Solve inverse kinematics for the given target position (metres, URDF frame).
   * `currentAngles` seeds the solver; defaults to all-zero if omitted.
   * Returns null when no IK model is available for the active robot.
   */
  inverseKinematics(targetPosition: [number, number, number], currentAngles?: Record<string, number>): Promise<Record<string, number> | null>
}

// --- Plugin service data types ---

export interface PluginUserRobot {
  id: string
  name: string
  model: string
  calibration: Record<string, unknown>
  createdAt: string
}

export interface PluginPathSummary {
  id: string
  name: string
  description: string | null
  robotModel: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface PluginPath extends PluginPathSummary {
  points: Array<Record<string, number>>
}

export interface PluginConnectedRobot {
  role: string
  robotId: string | null
  robotModel: string | null
  virtual: boolean
  remote: boolean
}

// --- Plugin service ---

/**
 * Minimal context passed to `PluginServiceFactory`.
 * Services run in the background and do not have access to UI or robot connections.
 */
export interface PluginServiceContext {
  /** Currently signed-in user, or null when not authenticated. */
  user: PluginUser | null
  /** Active locale code. */
  locale: string
  /**
   * Access a running service from another installed plugin.
   * Returns null when the service is not installed or not yet initialised.
   */
  service: (providerId: string) => unknown
  /** List all robots belonging to the current user. */
  listUserRobots(): Promise<PluginUserRobot[]>
  /** List all motion paths belonging to the current user (without waypoints). */
  listUserPaths(): Promise<PluginPathSummary[]>
  /** Read a motion path by ID. Returns null when not found or access denied. */
  readPath(id: string): Promise<PluginPath | null>
  /** List currently connected robot arms. Always reflects live connection state. */
  listConnectedRobots(): PluginConnectedRobot[]
  /**
   * Read the current joint angles and end-effector position of a connected robot arm.
   * Returns null when the role is not connected or the robot model is unknown.
   */
  getRobotPosition(role: ConnectionRole): Promise<{ joints: Record<string, number>; position: [number, number, number]; rotation: [[number, number, number], [number, number, number], [number, number, number]] } | null>

  /** Disable torque on all servos (arm goes limp). Requires robot.control scope. */
  stopRobot(role: ConnectionRole): Promise<void>

  /**
   * Detect all objects in an image using the Gemini vision model.
   * Pass a base64-encoded image string and its MIME type.
   * Returns an array of detected objects with pixel-space bounding boxes.
   * Requires the `user.auth` scope (the user must be signed in).
   */
  extractSceneObjects(imageBase64: string, mimeType?: string): Promise<SceneObject[]>

  /**
   * Move the robot end-effector to the given XYZ position (metres, URDF frame) using
   * inverse kinematics. Requires robot.control scope and an IK model on the robot config.
   * Throws when no robot is connected, IK is unavailable, or no solution is found.
   */
  moveToPosition(x: number, y: number, z: number, role?: ConnectionRole): Promise<void>

  /**
   * Move all servos to their neutral (home) positions. Requires robot.control scope.
   * Throws when no robot is connected.
   */
  goHome(role?: ConnectionRole): Promise<void>

  /**
   * Execute a saved motion path once by replaying its waypoints to the robot.
   * Requires robot.control scope and user.read scope.
   * Throws when the path is not found or no robot is connected.
   */
  executePath(id: string, role?: ConnectionRole): Promise<void>
}

/**
 * Factory exported as the named `PluginService` export from an installable plugin bundle.
 * Called once when the plugin is initialised on app start.
 * The return value is registered under the plugin's `provides` identifier.
 */
export type PluginServiceFactory = (context: PluginServiceContext) => unknown

// --- Plugin context ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>

export interface PluginContext {
  /**
   * Access a robot connection by role. Always available regardless of scopes.
   *
   * - `robot('default')` — the primary (follower) arm, present for any plugin that
   *   uses a `robot.*` scope.
   * - `robot('leader')` — the leader arm; requires the `robot.leader` scope. The host
   *   prompts for both connections before loading the plugin when this scope is declared.
   *
   * The top-level `connection`, `servo`, `robotConfig`, `openConnectDialog`,
   * `saveCalibration`, `saveRangeCalibration`, `saveCameraCalibration`, and
   * `showSafetyWarning` fields are shorthands for `robot('default')` and are kept
   * for single-arm plugin convenience.
   */
  robot: (role: ConnectionRole) => RobotHandle

  // --- Shorthands for robot('default') ---

  connection: RobotHandle['connection']
  openConnectDialog: RobotHandle['openConnectDialog']
  servo: RobotHandle['servo']
  robotConfig: RobotHandle['robotConfig']
  cameraCalibration: RobotHandle['cameraCalibration']
  saveCalibration: RobotHandle['saveCalibration']
  saveRangeCalibration: RobotHandle['saveRangeCalibration']
  saveCameraCalibration: RobotHandle['saveCameraCalibration']
  showSafetyWarning: RobotHandle['showSafetyWarning']

  /**
   * Forward and inverse kinematics for the active robot.
   * FK is always available. IK requires a trained model (`ikModelUrl` on the robot config).
   */
  kinematics: KinematicsApi

  /**
   * 3D robot visualization. The host injects the robot config automatically.
   * Use a React ref typed as WorldViewApi to call imperative methods.
   */
  WorldView: React.ForwardRefExoticComponent<PluginWorldViewProps & React.RefAttributes<WorldViewApi>>

  /**
   * Access a running service from another installed plugin by its `provides` identifier.
   * Returns null when the service is not installed or not yet initialised.
   * The calling plugin must declare the provider in its manifest `dependencies`.
   */
  service: (providerId: string) => unknown

  // --- Host services ---

  /** Navigate to a host URL (wraps React Router navigate). */
  navigate: (url: string) => void

  /** Currently signed-in user, or null when not authenticated. */
  user: PluginUser | null

  /** Available robot models. */
  robotModels: PluginRobotModel[]

  /**
   * Detect all objects in a camera frame using the Gemini vision model.
   * Pass a base64-encoded image string and its MIME type.
   * Returns an array of detected objects with pixel-space bounding boxes.
   * Requires the `user.auth` scope (the user must be signed in).
   */
  extractSceneObjects(imageBase64: string, mimeType?: string): Promise<SceneObject[]>

  /** Show brief toast notifications. */
  toast: {
    success: (message: string) => void
    error: (message: string) => void
  }

  /** Subset of the host UI component library. */
  ui: {
    CameraView: React.ForwardRefExoticComponent<CameraViewProps & React.RefAttributes<CameraViewHandle>>
    Button: React.ComponentType<ButtonProps>
    Card: React.ComponentType<CardProps>
    Checkbox: React.ComponentType<CheckboxProps>
    Input: React.ComponentType<InputProps>
    Dialog: AnyComponent
    DialogContent: AnyComponent
    DialogDescription: AnyComponent
    DialogFooter: AnyComponent
    DialogHeader: AnyComponent
    DialogTitle: AnyComponent
    Separator: AnyComponent
    Skeleton: AnyComponent
    Table: AnyComponent
    TableBody: AnyComponent
    TableCell: AnyComponent
    TableHead: AnyComponent
    TableHeader: AnyComponent
    TableRow: AnyComponent
    Tooltip: AnyComponent
    TooltipContent: AnyComponent
    TooltipProvider: AnyComponent
    TooltipTrigger: AnyComponent
  }

  // --- i18n ---

  /**
   * Available cameras from the platform registry.
   * Requires the `camera.read` scope; empty array when not declared.
   */
  cameras: CameraHandle[]

  /** Active locale code (e.g. 'en', 'ru'). Changes when the user switches language. */
  locale: string

  /**
   * Resolve a localized string from a locale map.
   * Falls back to 'en' when the active locale is absent.
   */
  localize: (map: Record<string, string>) => string
}

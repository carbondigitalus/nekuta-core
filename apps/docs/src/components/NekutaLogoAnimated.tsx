import React, {
    Component,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent
} from 'react';

import './nekuta-logo-animated.css';

export interface NekutaLogoAnimatedProps {
    className?: string;
    idPrefix?: string;
    interactive?: boolean;
    label?: string;
    size?: number | string;
}

interface NekutaLogoAnimatedState {
    blinking: boolean;
    eyeX: number;
    eyeY: number;
    hovered: boolean;
    reducedMotion: boolean;
}

interface Position {
    x: number;
    y: number;
}

let instanceCount = 0;

const clamp = (value: number, minimum: number, maximum: number): number =>
    Math.min(maximum, Math.max(minimum, value));

export class NekutaLogoAnimated extends Component<
    NekutaLogoAnimatedProps,
    NekutaLogoAnimatedState
> {
    public static defaultProps: Partial<NekutaLogoAnimatedProps> = {
        interactive: true,
        label: 'Nekutā mango mascot',
        size: '100%'
    };

    private readonly instanceId: string;
    private readonly svgRef = React.createRef<SVGSVGElement>();
    private animationFrame: number | null = null;
    // Plain `number`, not `ReturnType<typeof setTimeout>` — with "node" in this
    // tsconfig's `types`, `window`'s type is `Window & typeof globalThis`, and
    // that intersection resolves `setTimeout`'s return type ambiguously between
    // the DOM's `number` and Node's `Timeout` even when accessed via `window.`.
    // The actual runtime value here is always the browser's numeric timer id.
    private blinkTimer: number | null = null;
    private idleTimer: number | null = null;
    private motionQuery: MediaQueryList | null = null;
    private target: Position = { x: 0, y: 0 };

    public constructor(props: NekutaLogoAnimatedProps) {
        super(props);
        instanceCount += 1;
        this.instanceId = props.idPrefix ?? `nekuta-${instanceCount}`;
        this.state = {
            blinking: false,
            eyeX: 0,
            eyeY: 0,
            hovered: false,
            reducedMotion: false
        };
    }

    public componentDidMount(): void {
        this.motionQuery = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );
        this.setState({ reducedMotion: this.motionQuery.matches });
        this.motionQuery.addEventListener(
            'change',
            this.handleMotionPreference
        );

        if (this.props.interactive) {
            window.addEventListener(
                'pointermove',
                this.handleWindowPointerMove,
                {
                    passive: true
                }
            );
        }

        this.scheduleBlink();
        this.animationFrame = window.requestAnimationFrame(this.animate);
    }

    public componentDidUpdate(previousProps: NekutaLogoAnimatedProps): void {
        if (previousProps.interactive === this.props.interactive) return;

        if (this.props.interactive) {
            window.addEventListener(
                'pointermove',
                this.handleWindowPointerMove,
                {
                    passive: true
                }
            );
        } else {
            window.removeEventListener(
                'pointermove',
                this.handleWindowPointerMove
            );
            this.target = { x: 0, y: 0 };
        }
    }

    public componentWillUnmount(): void {
        window.removeEventListener('pointermove', this.handleWindowPointerMove);
        this.motionQuery?.removeEventListener(
            'change',
            this.handleMotionPreference
        );

        if (this.animationFrame !== null)
            window.cancelAnimationFrame(this.animationFrame);
        if (this.blinkTimer !== null) window.clearTimeout(this.blinkTimer);
        if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
    }

    private readonly handleMotionPreference = (
        event: MediaQueryListEvent
    ): void => {
        this.setState({ reducedMotion: event.matches });
        if (event.matches) this.target = { x: 0, y: 0 };
    };

    private readonly handleWindowPointerMove = (event: PointerEvent): void => {
        if (this.state.reducedMotion) return;

        const svg = this.svgRef.current;
        if (!svg) return;

        const bounds = svg.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0) return;

        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height * 0.53;

        this.target = {
            x: clamp((event.clientX - centerX) / (bounds.width * 0.42), -1, 1),
            y: clamp((event.clientY - centerY) / (bounds.height * 0.38), -1, 1)
        };

        if (this.idleTimer !== null) window.clearTimeout(this.idleTimer);
        this.idleTimer = window.setTimeout(() => {
            this.target = { x: 0, y: 0 };
        }, 3000);
    };

    private readonly animate = (): void => {
        const { eyeX, eyeY, reducedMotion } = this.state;
        const nextX = reducedMotion ? 0 : eyeX + (this.target.x - eyeX) * 0.13;
        const nextY = reducedMotion ? 0 : eyeY + (this.target.y - eyeY) * 0.13;

        if (Math.abs(nextX - eyeX) > 0.001 || Math.abs(nextY - eyeY) > 0.001) {
            this.setState({ eyeX: nextX, eyeY: nextY });
        }

        this.animationFrame = window.requestAnimationFrame(this.animate);
    };

    private readonly scheduleBlink = (): void => {
        if (this.blinkTimer !== null) window.clearTimeout(this.blinkTimer);

        const delay = 2400 + Math.random() * 5600;
        this.blinkTimer = window.setTimeout(() => {
            if (!this.state.reducedMotion) {
                this.setState({ blinking: true }, () => {
                    this.blinkTimer = window.setTimeout(() => {
                        this.setState({ blinking: false }, this.scheduleBlink);
                    }, 135);
                });
            } else {
                this.scheduleBlink();
            }
        }, delay);
    };

    private readonly handlePointerEnter = (): void => {
        if (!this.state.reducedMotion) this.setState({ hovered: true });
    };

    private readonly handlePointerLeave = (
        _event: ReactPointerEvent<SVGSVGElement>
    ): void => {
        this.target = { x: 0, y: 0 };
        this.setState({ hovered: false });
    };

    public render(): React.ReactNode {
        const { className, label, size } = this.props;
        const { blinking, eyeX, eyeY, hovered, reducedMotion } = this.state;
        const rootClassName = [
            'nekuta-logo',
            hovered ? 'nekuta-logo--hovered' : '',
            reducedMotion ? 'nekuta-logo--reduced-motion' : '',
            className ?? ''
        ]
            .filter(Boolean)
            .join(' ');

        const style: CSSProperties = { height: size, width: size };
        const pupilTransform = `translate(${eyeX * 13} ${eyeY * 11})`;
        const bodyTransform = reducedMotion
            ? undefined
            : `rotate(${eyeX * 1.4} 512 580) translate(${eyeX * 2} ${eyeY * 1.5})`;
        const leafTransform = reducedMotion
            ? undefined
            : `rotate(${eyeX * 3.2} 550 255)`;

        const mangoGradient = `${this.instanceId}-mango`;
        const leafGradient = `${this.instanceId}-leaf`;
        const stemGradient = `${this.instanceId}-stem`;
        const limbGradient = `${this.instanceId}-limb`;
        const leftEyeClip = `${this.instanceId}-left-eye-clip`;
        const rightEyeClip = `${this.instanceId}-right-eye-clip`;

        return (
            <svg
                ref={this.svgRef}
                aria-label={label}
                className={rootClassName}
                onPointerEnter={this.handlePointerEnter}
                onPointerLeave={this.handlePointerLeave}
                role="img"
                style={style}
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient
                        id={mangoGradient}
                        x1="210"
                        y1="230"
                        x2="820"
                        y2="890"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#FFE55C" />
                        <stop offset="0.52" stopColor="#FFC53D" />
                        <stop offset="0.78" stopColor="#FF9638" />
                        <stop offset="1" stopColor="#F4603E" />
                    </linearGradient>
                    <linearGradient
                        id={leafGradient}
                        x1="550"
                        y1="115"
                        x2="855"
                        y2="360"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#68D85E" />
                        <stop offset="0.5" stopColor="#28AF4F" />
                        <stop offset="1" stopColor="#07883E" />
                    </linearGradient>
                    <linearGradient
                        id={stemGradient}
                        x1="490"
                        y1="100"
                        x2="555"
                        y2="260"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor="#A96D35" />
                        <stop offset="1" stopColor="#75451F" />
                    </linearGradient>
                    <linearGradient
                        id={limbGradient}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <stop offset="0" stopColor="#EAA110" />
                        <stop offset="1" stopColor="#D98208" />
                    </linearGradient>
                    <clipPath id={leftEyeClip}>
                        <circle cx="386" cy="520" r="45" />
                    </clipPath>
                    <clipPath id={rightEyeClip}>
                        <circle cx="644" cy="520" r="45" />
                    </clipPath>
                </defs>

                <g className="nekuta-logo__float">
                    <g className="nekuta-logo__leaf" transform={leafTransform}>
                        <path
                            d="M501 256C505 209 498 178 479 145C465 121 475 92 498 83C524 73 547 89 558 116C573 154 569 209 554 270Z"
                            fill={`url(#${stemGradient})`}
                        />
                        <path
                            d="M540 159C622 83 746 92 851 174C846 281 790 350 686 391C613 364 565 304 540 159Z"
                            fill={`url(#${leafGradient})`}
                        />
                        <path
                            d="M568 175C661 186 748 231 826 322"
                            fill="none"
                            stroke="#81DE55"
                            strokeWidth="13"
                            strokeLinecap="round"
                            opacity=".75"
                        />
                    </g>

                    <g className="nekuta-logo__body" transform={bodyTransform}>
                        <path
                            d="M499 215C649 195 785 293 829 441C875 596 827 786 696 883C602 952 418 961 297 886C190 819 152 686 190 565C218 474 281 421 315 336C344 265 407 228 499 215Z"
                            fill={`url(#${mangoGradient})`}
                        />

                        <g className="nekuta-logo__arm nekuta-logo__arm--left">
                            <path
                                d="M281 659C307 691 333 715 367 737"
                                fill="none"
                                stroke={`url(#${limbGradient})`}
                                strokeWidth="25"
                                strokeLinecap="round"
                            />
                        </g>
                        <g className="nekuta-logo__arm nekuta-logo__arm--right">
                            <path
                                d="M750 651C726 686 701 712 669 735"
                                fill="none"
                                stroke={`url(#${limbGradient})`}
                                strokeWidth="25"
                                strokeLinecap="round"
                            />
                        </g>
                        <path
                            d="M420 908C418 932 412 953 402 976"
                            fill="none"
                            stroke={`url(#${limbGradient})`}
                            strokeWidth="25"
                            strokeLinecap="round"
                        />
                        <path
                            d="M611 914C614 939 620 959 630 980"
                            fill="none"
                            stroke={`url(#${limbGradient})`}
                            strokeWidth="25"
                            strokeLinecap="round"
                        />

                        <ellipse
                            cx="368"
                            cy="578"
                            rx="46"
                            ry="19"
                            fill="#F197C7"
                            opacity=".9"
                        />
                        <ellipse
                            cx="663"
                            cy="578"
                            rx="46"
                            ry="19"
                            fill="#F197C7"
                            opacity=".9"
                        />

                        {blinking ? (
                            <g className="nekuta-logo__blink">
                                <path
                                    d="M337 520C363 542 408 542 435 520"
                                    fill="none"
                                    stroke="#3A2708"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M595 520C621 542 666 542 693 520"
                                    fill="none"
                                    stroke="#3A2708"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                />
                            </g>
                        ) : (
                            <g className="nekuta-logo__eyes">
                                <circle
                                    cx="386"
                                    cy="520"
                                    r="59"
                                    fill="#FFFFFF"
                                />
                                <g
                                    clipPath={`url(#${leftEyeClip})`}
                                    transform={pupilTransform}
                                >
                                    <circle
                                        cx="386"
                                        cy="520"
                                        r="38"
                                        fill="#050505"
                                    />
                                    <circle
                                        cx="373"
                                        cy="506"
                                        r="13"
                                        fill="#FFFFFF"
                                    />
                                </g>
                                <circle
                                    cx="644"
                                    cy="520"
                                    r="59"
                                    fill="#FFFFFF"
                                />
                                <g
                                    clipPath={`url(#${rightEyeClip})`}
                                    transform={pupilTransform}
                                >
                                    <circle
                                        cx="644"
                                        cy="520"
                                        r="38"
                                        fill="#050505"
                                    />
                                    <circle
                                        cx="631"
                                        cy="506"
                                        r="13"
                                        fill="#FFFFFF"
                                    />
                                </g>
                            </g>
                        )}

                        <g className="nekuta-logo__mouth">
                            <path
                                className="nekuta-logo__smile"
                                d="M468 581C481 600 497 608 516 608C535 608 552 600 565 581"
                                fill="none"
                                stroke="#050505"
                                strokeWidth="14"
                                strokeLinecap="round"
                            />
                            <path
                                className="nekuta-logo__open-mouth"
                                d="M468 579C475 626 553 626 565 579C549 568 485 568 468 579Z"
                                fill="#D95F6B"
                                stroke="#050505"
                                strokeWidth="10"
                                strokeLinejoin="round"
                            />
                        </g>
                    </g>
                </g>
            </svg>
        );
    }
}

export default NekutaLogoAnimated;
